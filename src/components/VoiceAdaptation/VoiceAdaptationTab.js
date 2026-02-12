import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Typography,
  Upload,
  Select,
  Button,
  Table,
  Tag,
  Space,
  message,
  Progress,
  Row,
  Col,
  Statistic,
  Input,
  Modal,
  Tooltip,
  Spin,
  Alert,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import autoBlogAPI from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const { Title, Text } = Typography;
const { Search } = Input;

const POLL_INTERVAL_MS = 5000;
const MAX_FILES_PER_UPLOAD = 10;
const ALLOWED_EXTENSIONS = autoBlogAPI.VOICE_SAMPLE_ALLOWED_EXTENSIONS;
const SOURCE_TYPE_OPTIONS = [
  { value: 'blog_post', label: 'Blog post' },
  { value: 'whitepaper', label: 'Whitepaper' },
  { value: 'email', label: 'Email' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'social_post', label: 'Social post' },
  { value: 'call_summary', label: 'Call summary' },
  { value: 'other_document', label: 'Other document' },
];

function getFileExtension(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function validateFiles(fileList) {
  const invalid = fileList.filter((f) => !ALLOWED_EXTENSIONS.includes(getFileExtension(f.name)));
  if (invalid.length) {
    return { valid: false, invalid };
  }
  if (fileList.length > MAX_FILES_PER_UPLOAD) {
    return { valid: false, tooMany: true };
  }
  return { valid: true };
}

function statusColor(status) {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'processing':
      return 'blue';
    default:
      return 'default';
  }
}

function qualityScoreColor(score) {
  if (score == null) return 'default';
  if (score >= 80) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
}

export default function VoiceAdaptationTab() {
  const { user, currentOrganization } = useAuth();
  const orgId = currentOrganization?.id || user?.organizationId;

  const [samples, setSamples] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sourceType, setSourceType] = useState('blog_post');
  const [fileList, setFileList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterSourceType, setFilterSourceType] = useState(undefined);
  const [deleteModal, setDeleteModal] = useState({ visible: false, sample: null });
  const [reanalyzingId, setReanalyzingId] = useState(null);

  const hasPendingOrProcessing = useMemo(
    () => samples.some((s) => s.processing_status === 'pending' || s.processing_status === 'processing'),
    [samples]
  );

  const fetchSamples = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await autoBlogAPI.listVoiceSamples(orgId);
      setSamples(res.samples || []);
    } catch (err) {
      message.error(err.message || 'Failed to load samples');
    } finally {
      setLoadingSamples(false);
    }
  }, [orgId]);

  const fetchProfile = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await autoBlogAPI.getVoiceProfile(orgId);
      setProfile(res.profile || null);
    } catch (err) {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!orgId) {
      setLoadingSamples(false);
      setLoadingProfile(false);
      return;
    }
    fetchSamples();
    fetchProfile();
  }, [orgId, fetchSamples, fetchProfile]);

  useEffect(() => {
    if (!hasPendingOrProcessing || !orgId) return;
    const t = setInterval(fetchSamples, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [hasPendingOrProcessing, orgId, fetchSamples]);

  const handleUpload = async () => {
    if (!orgId) {
      message.error('No organization selected.');
      return;
    }
    const files = fileList.map((f) => f.originFileObj).filter(Boolean);
    if (!files.length) {
      message.error('Please select at least one file.');
      return;
    }
    const { valid, invalid, tooMany } = validateFiles(files);
    if (!valid) {
      if (tooMany) message.error(`Maximum ${MAX_FILES_PER_UPLOAD} files per upload.`);
      else if (invalid?.length) message.error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const tick = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 90)), 200);
    try {
      await autoBlogAPI.uploadVoiceSamples(orgId, sourceType, files, { weight: 1 });
      setUploadProgress(100);
      message.success(`Uploaded ${files.length} sample(s). Analysis has been queued.`);
      setFileList([]);
      await fetchSamples();
      await fetchProfile();
    } catch (err) {
      message.error(err.message || 'Upload failed');
    } finally {
      clearInterval(tick);
      setUploadProgress(0);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const { sample } = deleteModal;
    if (!sample?.id) return;
    try {
      await autoBlogAPI.deleteVoiceSample(sample.id);
      message.success('Sample deactivated');
      setDeleteModal({ visible: false, sample: null });
      await fetchSamples();
      await fetchProfile();
    } catch (err) {
      message.error(err.message || 'Failed to deactivate');
    }
  };

  const handleReanalyze = async (sample) => {
    if (!sample?.id) return;
    setReanalyzingId(sample.id);
    try {
      await autoBlogAPI.reanalyzeVoiceSample(sample.id);
      message.success('Reanalysis queued');
      await fetchSamples();
    } catch (err) {
      message.error(err.message || 'Reanalyze failed');
    } finally {
      setReanalyzingId(null);
    }
  };

  const handleExportProfile = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-profile-${orgId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Profile exported');
  };

  const filteredSamples = useMemo(() => {
    let list = samples.filter((s) => s.is_active !== false);
    if (filterSourceType) list = list.filter((s) => s.source_type === filterSourceType);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (s) =>
          (s.file_name && s.file_name.toLowerCase().includes(q)) ||
          (s.title && s.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [samples, filterSourceType, searchText]);

  const columns = [
    {
      title: 'Source type',
      dataIndex: 'source_type',
      key: 'source_type',
      width: 130,
      render: (val) => (
        <Tag color="blue">{SOURCE_TYPE_OPTIONS.find((o) => o.value === val)?.label || val}</Tag>
      ),
    },
    {
      title: 'Title / Filename',
      key: 'name',
      render: (_, r) => r.title || r.file_name || '—',
    },
    { title: 'Word count', dataIndex: 'word_count', key: 'word_count', width: 100 },
    {
      title: 'Quality',
      dataIndex: 'quality_score',
      key: 'quality_score',
      width: 90,
      render: (score) =>
        score != null ? (
          <Tag color={qualityScoreColor(score)}>{score}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'processing_status',
      key: 'processing_status',
      width: 110,
      render: (status) => <Tag color={statusColor(status)}>{status || '—'}</Tag>,
    },
    {
      title: 'Uploaded',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => (date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Deactivate">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => setDeleteModal({ visible: true, sample: record })}
              danger
            />
          </Tooltip>
          <Tooltip title="Re-analyze">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={reanalyzingId === record.id} />}
              onClick={() => handleReanalyze(record)}
              disabled={reanalyzingId === record.id}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (!user) {
    return (
      <Alert
        type="info"
        message="Sign in required"
        description="Voice adaptation is available only when you are logged in as the organization owner."
      />
    );
  }

  if (!orgId) {
    return (
      <Alert
        type="warning"
        message="No organization"
        description="Create or select an organization to manage voice samples."
      />
    );
  }

  return (
    <div style={{ padding: 'var(--space-4) 0' }}>
      <Title level={3} style={{ marginBottom: 'var(--space-4)' }}>
        <SoundOutlined /> Voice adaptation
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 'var(--space-6)' }}>
        Upload writing samples so we can learn your voice and generate blog content that sounds like you.
      </Text>

      {/* Upload */}
      <Card title="Upload samples" style={{ marginBottom: 'var(--space-6)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="200px">
            <Text strong>Source type</Text>
            <Select
              value={sourceType}
              onChange={setSourceType}
              options={SOURCE_TYPE_OPTIONS}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col flex="auto">
            <Upload.Dragger
              multiple
              maxCount={MAX_FILES_PER_UPLOAD}
              fileList={fileList}
              beforeUpload={(file) => {
                const ext = getFileExtension(file.name);
                if (!ALLOWED_EXTENSIONS.includes(ext)) {
                  message.error(`File type ${ext} not allowed. Use: ${ALLOWED_EXTENSIONS.join(', ')}`);
                  return Upload.LIST_IGNORE;
                }
                setFileList((prev) => [...prev, { uid: file.uid, name: file.name, originFileObj: file }]);
                return false;
              }}
              onRemove={(file) => setFileList((prev) => prev.filter((f) => f.uid !== file.uid))}
              accept={ALLOWED_EXTENSIONS.join(',')}
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ fontSize: 48, color: 'var(--color-primary)' }} />
              </p>
              <p className="ant-upload-text">Drag files here or click to browse</p>
              <p className="ant-upload-hint">Allowed: {ALLOWED_EXTENSIONS.join(', ')}. Max {MAX_FILES_PER_UPLOAD} files per upload.</p>
            </Upload.Dragger>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              loading={uploading}
              disabled={!fileList.length || uploading}
            >
              Upload
            </Button>
          </Col>
        </Row>
        {uploading && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={uploadProgress} status="active" />
          </div>
        )}
      </Card>

      {/* Profile summary */}
      <Card title="Voice profile" style={{ marginBottom: 'var(--space-6)' }}>
        {loadingProfile ? (
          <Spin tip="Loading profile…" />
        ) : profile ? (
          <>
            <Row gutter={[24, 16]}>
              <Col>
                <Statistic
                  title="Confidence"
                  value={profile.confidence_score ?? 0}
                  suffix="%"
                  valueStyle={{
                    color:
                      (profile.confidence_score ?? 0) >= 50
                        ? 'var(--color-success)'
                        : 'var(--color-warning)',
                  }}
                />
              </Col>
              <Col>
                <Statistic title="Samples" value={profile.sample_count ?? 0} />
              </Col>
              <Col>
                <Statistic title="Total words" value={profile.total_word_count ?? 0} />
              </Col>
              <Col>
                <Statistic
                  title="Last updated"
                  value={profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true }) : '—'}
                />
              </Col>
              <Col>
                <Button type="default" icon={<DownloadOutlined />} onClick={handleExportProfile}>
                  Export profile (JSON)
                </Button>
              </Col>
            </Row>
            {(profile.confidence_score ?? 0) >= 50 && (
              <Alert
                type="success"
                message="Voice ready"
                description="Your voice profile is being used for blog generation."
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </>
        ) : (
          <Text type="secondary">No profile yet. Upload and process samples to build your voice profile.</Text>
        )}
      </Card>

      {/* Samples table */}
      <Card
        title="Samples"
        extra={
          <Space>
            <Search
              placeholder="Search by title or filename"
              allowClear
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Filter by source type"
              allowClear
              value={filterSourceType}
              onChange={setFilterSourceType}
              options={SOURCE_TYPE_OPTIONS}
              style={{ width: 160 }}
            />
          </Space>
        }
      >
        {hasPendingOrProcessing && (
          <Alert
            type="info"
            message="Analysis in progress"
            description="Samples are being analyzed. This list updates every few seconds."
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredSamples}
          loading={loadingSamples}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
        />
      </Card>

      {/* Delete confirmation */}
      <Modal
        title="Deactivate sample"
        open={deleteModal.visible}
        onOk={handleDelete}
        onCancel={() => setDeleteModal({ visible: false, sample: null })}
        okText="Deactivate"
        okButtonProps={{ danger: true }}
      >
        <p>
          Deactivate &quot;{deleteModal.sample?.title || deleteModal.sample?.file_name}&quot;? The sample will be
          removed from your voice profile.
        </p>
      </Modal>
    </div>
  );
}

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

const { Title, Text, Paragraph } = Typography;
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
  const [voiceProperties, setVoiceProperties] = useState([]); // display-ready sections from profile API
  const [derivedDirectives, setDerivedDirectives] = useState([]); // rules applied during generation
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
      setVoiceProperties(Array.isArray(res.voiceProperties) ? res.voiceProperties : []);
      setDerivedDirectives(Array.isArray(res.derivedDirectives) ? res.derivedDirectives : []);
    } catch (err) {
      setProfile(null);
      setVoiceProperties([]);
      setDerivedDirectives([]);
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
      <div style={{ padding: 'var(--space-6) 0' }}>
        <Alert
          type="info"
          message="Sign in required"
          description="Voice adaptation is available only when you're logged in as the organization owner."
          showIcon
        />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div style={{ padding: 'var(--space-6) 0' }}>
        <Alert
          type="warning"
          message="No organization"
          description="Create or select an organization in Settings to manage voice samples."
          showIcon
        />
      </div>
    );
  }

  const isVoiceReady = profile && (profile.confidence_score ?? 0) >= 50;

  return (
    <div style={{ padding: 'var(--space-6) 0', maxWidth: 960, margin: '0 auto' }}>
      {/* Page header */}
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Title level={2} style={{ marginBottom: 'var(--space-2)', fontWeight: 600 }}>
          Voice adaptation
        </Title>
        <Paragraph
          type="secondary"
          style={{
            marginBottom: 0,
            fontSize: 'var(--font-size-base)',
            lineHeight: 1.5,
            color: 'var(--color-text-secondary)',
          }}
        >
          Upload writing samples (blog posts, emails, newsletters) so we can learn how you write. New posts will then be generated in your voice.
        </Paragraph>
      </header>

      {/* Upload */}
      <Card
        title={<span style={{ fontWeight: 600 }}>Upload samples</span>}
        style={{ marginBottom: 'var(--space-6)' }}
        styles={{ body: { padding: 'var(--space-6)' } }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={24} md={8} lg={6}>
            <label className="ant-form-item-required" style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
              Source type
            </label>
            <Select
              value={sourceType}
              onChange={setSourceType}
              options={SOURCE_TYPE_OPTIONS}
              style={{ width: '100%' }}
              aria-label="Sample source type"
            />
          </Col>
          <Col xs={24} sm={24} md={16} lg={14}>
            <Upload.Dragger
              multiple
              maxCount={MAX_FILES_PER_UPLOAD}
              fileList={fileList}
              beforeUpload={(file) => {
                const ext = getFileExtension(file.name);
                if (!ALLOWED_EXTENSIONS.includes(ext)) {
                  message.error(`File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
                  return Upload.LIST_IGNORE;
                }
                setFileList((prev) => [...prev, { uid: file.uid, name: file.name, originFileObj: file }]);
                return false;
              }}
              onRemove={(file) => setFileList((prev) => prev.filter((f) => f.uid !== file.uid))}
              accept={ALLOWED_EXTENSIONS.join(',')}
              aria-label="Upload writing sample files"
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ fontSize: 40, color: 'var(--color-primary)' }} />
              </p>
              <p className="ant-upload-text" style={{ marginBottom: 'var(--space-1)' }}>
                Drag files here or click to browse
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                {ALLOWED_EXTENSIONS.join(', ')} — up to {MAX_FILES_PER_UPLOAD} files per upload
              </p>
            </Upload.Dragger>
          </Col>
          <Col xs={24} sm={24} md={24} lg={4} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              loading={uploading}
              disabled={!fileList.length || uploading}
              size="large"
            >
              Upload
            </Button>
          </Col>
        </Row>
        {uploading && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Progress percent={uploadProgress} status="active" strokeColor="var(--color-primary)" />
          </div>
        )}
      </Card>

      {/* Profile summary */}
      <Card
        title={
          <Space align="center">
            <span style={{ fontWeight: 600 }}>Voice profile</span>
            {isVoiceReady && (
              <Tag color="success">Voice ready</Tag>
            )}
          </Space>
        }
        style={{ marginBottom: 'var(--space-6)' }}
        styles={{ body: { padding: 'var(--space-6)' } }}
      >
        {loadingProfile ? (
          <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
            <Spin tip="Loading profile…" size="large" />
          </div>
        ) : profile ? (
          <>
            <Row gutter={[32, 24]}>
              <Col xs={12} sm={12} md={6}>
                <Statistic
                  title={<span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Confidence</span>}
                  value={profile.confidence_score ?? 0}
                  suffix="%"
                  valueStyle={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 600,
                    color: (profile.confidence_score ?? 0) >= 50 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Statistic
                  title={<span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Samples</span>}
                  value={profile.sample_count ?? 0}
                  valueStyle={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Statistic
                  title={<span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Total words</span>}
                  value={profile.total_word_count ?? 0}
                  valueStyle={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}
                />
              </Col>
              <Col xs={12} sm={12} md={6}>
                <Statistic
                  title={<span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Last updated</span>}
                  value={profile.updated_at ? formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true }) : '—'}
                  valueStyle={{ fontSize: 'var(--font-size-base)', fontWeight: 500 }}
                />
              </Col>
            </Row>
            {voiceProperties.length > 0 && (
              <div style={{ marginTop: 'var(--space-6)' }}>
                <Title level={5} style={{ marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                  Voice traits
                </Title>
                {voiceProperties.map((section, idx) => (
                  <div key={idx} style={{ marginBottom: 'var(--space-4)' }}>
                    <Text strong style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      {section.section}
                    </Text>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', listStyle: 'disc' }}>
                      {(section.items || []).map((item, i) => {
                        const val = item.value;
                        const display =
                          Array.isArray(val) ? val.join(', ') : val === null || val === undefined ? '—' : String(val);
                        return (
                          <li key={i} style={{ marginBottom: 'var(--space-1)' }}>
                            <Text>{item.label}: </Text>
                            <Text type="secondary">{display}</Text>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {derivedDirectives.length > 0 && (
              <div style={{ marginTop: 'var(--space-6)' }}>
                <Title level={5} style={{ marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                  Rules applied to generation
                </Title>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', listStyle: 'disc' }}>
                  {derivedDirectives.map((rule, i) => (
                    <li key={i} style={{ marginBottom: 'var(--space-2)' }}>
                      <Text>{rule}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Row style={{ marginTop: 'var(--space-4)' }}>
              <Col>
                <Button type="default" icon={<DownloadOutlined />} onClick={handleExportProfile} size="middle">
                  Export profile (JSON)
                </Button>
              </Col>
            </Row>
            {isVoiceReady && (
              <Alert
                type="success"
                message="Your voice is used for new posts"
                description="When you generate a post in Posts, we use this profile so the draft sounds like you."
                showIcon
                style={{ marginTop: 'var(--space-4)' }}
              />
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
            <SoundOutlined style={{ fontSize: 32, color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)', display: 'block' }} />
            <Text type="secondary" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
              No voice profile yet
            </Text>
            <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 'var(--font-size-sm)' }}>
              Upload at least one sample above. After analysis finishes, your profile will appear here and be used for new posts.
            </Paragraph>
          </div>
        )}
      </Card>

      {/* Samples table */}
      <Card
        title={<span style={{ fontWeight: 600 }}>Samples</span>}
        style={{ marginBottom: 'var(--space-6)' }}
        styles={{ body: { padding: 'var(--space-6)' } }}
        extra={
          <Space wrap size="middle">
            <Search
              placeholder="Search samples"
              allowClear
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180, minWidth: 140 }}
              aria-label="Search samples by title or filename"
            />
            <Select
              placeholder="Source type"
              allowClear
              value={filterSourceType}
              onChange={setFilterSourceType}
              options={SOURCE_TYPE_OPTIONS}
              style={{ width: 160, minWidth: 130 }}
              aria-label="Filter by source type"
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
            style={{ marginBottom: 'var(--space-4)' }}
          />
        )}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredSamples}
          loading={loadingSamples}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} sample${total !== 1 ? 's' : ''}` }}
          size="small"
          locale={{ emptyText: 'No samples yet. Upload files above to get started.' }}
        />
      </Card>

      {/* Delete confirmation */}
      <Modal
        title="Deactivate sample"
        open={deleteModal.visible}
        onOk={handleDelete}
        onCancel={() => setDeleteModal({ visible: false, sample: null })}
        okText="Deactivate"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <Paragraph style={{ marginBottom: 0 }}>
          Deactivate &quot;{deleteModal.sample?.title || deleteModal.sample?.file_name}&quot;? It will be removed from your voice profile and no longer used for generation.
        </Paragraph>
      </Modal>
    </div>
  );
}

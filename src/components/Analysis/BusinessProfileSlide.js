import React from 'react';
import { Card, Row, Col, Typography, Tag, Space, Divider, Input } from 'antd';
import {
  GlobalOutlined,
  TeamOutlined,
  BulbOutlined,
  FileTextOutlined,
  RocketOutlined,
  DollarOutlined,
  AimOutlined,
  BookOutlined,
  SearchOutlined
} from '@ant-design/icons';
import './BusinessProfileSlide.css';

const { Title, Text, Paragraph } = Typography;

const EditableField = ({ value, onChange, multiline = false, placeholder = '' }) => {
  if (multiline) {
    return (
      <Input.TextArea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoSize={{ minRows: 2, maxRows: 6 }}
        style={{
          fontSize: '15px',
          lineHeight: '1.7',
          border: '1px solid var(--color-primary)',
          borderRadius: '8px',
          padding: '12px'
        }}
      />
    );
  }

  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        fontSize: '15px',
        border: '1px solid var(--color-primary)',
        borderRadius: '8px',
        padding: '8px 12px'
      }}
    />
  );
};

const BusinessProfileSlide = ({ profileData, editMode = false, onUpdate }) => {
  const handleFieldChange = (fieldKey, newValue) => {
    if (onUpdate) {
      onUpdate({
        ...profileData,
        [fieldKey]: newValue
      });
    }
  };

  return (
    <div className="business-profile-slide">
      <Card className="profile-slide-card" bordered={false}>
        {/* Header Section */}
        <div className="profile-header">
          {editMode ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <EditableField
                  value={profileData.businessName}
                  onChange={(v) => handleFieldChange('businessName', v)}
                  placeholder="Business name"
                />
              </div>
              <div>
                <EditableField
                  value={profileData.tagline}
                  onChange={(v) => handleFieldChange('tagline', v)}
                  placeholder="Tagline"
                />
              </div>
            </>
          ) : (
            <>
              <Title level={2} className="profile-title">
                {profileData.businessName}
              </Title>
              <Text className="profile-domain">
                <GlobalOutlined /> {profileData.domain} • {profileData.tagline}
              </Text>
            </>
          )}
        </div>

        <Divider />

        {/* Main Content Grid */}
        <Row gutter={[24, 24]}>
          {/* What They Do */}
          <Col xs={24} md={12}>
            <ProfileSection
              icon={<BulbOutlined />}
              title="What They Do"
              content={profileData.whatTheyDo}
              editMode={editMode}
              fieldKey="whatTheyDo"
              onFieldChange={handleFieldChange}
            />
          </Col>

          {/* Target Audience */}
          <Col xs={24} md={12}>
            <ProfileSection
              icon={<TeamOutlined />}
              title="Target Audience"
              content={profileData.targetAudience}
              editMode={editMode}
              fieldKey="targetAudience"
              onFieldChange={handleFieldChange}
            />
          </Col>

          {/* Brand Voice */}
          <Col xs={24} md={12}>
            <ProfileSection
              icon={<FileTextOutlined />}
              title="Brand Voice"
              content={profileData.brandVoice}
              editMode={editMode}
              fieldKey="brandVoice"
              onFieldChange={handleFieldChange}
            />
          </Col>

          {/* Content Focus */}
          <Col xs={24} md={12}>
            <ProfileSection
              icon={<AimOutlined />}
              title="Content Focus"
              content={profileData.contentFocus}
              editMode={editMode}
              fieldKey="contentFocus"
              onFieldChange={handleFieldChange}
            />
          </Col>

          {/* Calls-to-Action */}
          {profileData.ctas && profileData.ctas.length > 0 && (
            <Col xs={24}>
              <ProfileSection
                icon={<RocketOutlined />}
                title="Calls-to-Action Found"
                content={
                  <Space direction="vertical" size={8}>
                    {profileData.ctas.map((cta, i) => (
                      <div key={i}>
                        <Tag color="blue">{cta.text}</Tag>
                        {cta.url && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {cta.url}
                          </Text>
                        )}
                      </div>
                    ))}
                  </Space>
                }
              />
            </Col>
          )}

          {/* Business Model */}
          <Col xs={24} md={12}>
            <ProfileSection
              icon={<DollarOutlined />}
              title="Business Model"
              content={profileData.businessModel}
              editMode={editMode}
              fieldKey="businessModel"
              onFieldChange={handleFieldChange}
            />
          </Col>

          {/* Website Goals */}
          <Col xs={24} md={12}>
            <ProfileSection
              icon={<AimOutlined />}
              title="Website Goals"
              content={profileData.websiteGoals}
              editMode={editMode}
              fieldKey="websiteGoals"
              onFieldChange={handleFieldChange}
            />
          </Col>

          {/* Blog Strategy */}
          <Col xs={24}>
            <ProfileSection
              icon={<BookOutlined />}
              title="Blog Strategy"
              content={profileData.blogStrategy}
              editMode={editMode}
              fieldKey="blogStrategy"
              onFieldChange={handleFieldChange}
            />
          </Col>

          {/* Key Topics */}
          <Col xs={24}>
            <ProfileSection
              icon={<SearchOutlined />}
              title="Key Topics & Keywords"
              content={profileData.keyTopics || 'Could not fetch keyword data'}
              note={!profileData.keyTopics && 'API rate limits, or the site is new or not yet indexed. We can still suggest topics from the rest of the analysis.'}
              editMode={editMode}
              fieldKey="keyTopics"
              onFieldChange={handleFieldChange}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

const ProfileSection = ({ icon, title, content, note, editMode, fieldKey, onFieldChange }) => (
  <div className="profile-section">
    <div className="section-header">
      <span className="section-icon">{icon}</span>
      <Title level={5} className="section-title">{title}</Title>
    </div>
    <div className="section-content">
      {editMode ? (
        <EditableField
          value={content}
          onChange={(newValue) => onFieldChange(fieldKey, newValue)}
          multiline={typeof content === 'string' && content.length > 100}
          placeholder={`Enter ${title.toLowerCase()}...`}
        />
      ) : (
        typeof content === 'string' ? (
          <Paragraph className="section-text">{content}</Paragraph>
        ) : (
          content
        )
      )}
      {note && <Text type="secondary" italic className="section-note">{note}</Text>}
    </div>
  </div>
);

export default BusinessProfileSlide;

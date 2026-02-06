import React, { useState } from 'react';
import { Modal, Button, Select, Input, Switch, Typography, Space, message, Divider } from 'antd';
import {
  DownloadOutlined,
  CopyOutlined,
  FileTextOutlined,
  CodeOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useAnalytics } from '../../contexts/AnalyticsContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * Enhanced Export Modal Component
 * Provides multiple export formats and options
 */
const ExportModal = ({ 
  open, 
  onClose, 
  content = '', 
  title = 'Untitled Post',
  typography = {}
}) => {
  const [exportFormat, setExportFormat] = useState('markdown');
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeFormatting, setIncludeFormatting] = useState(true);
  const [customFilename, setCustomFilename] = useState('');
  const { trackEvent } = useAnalytics();

  // Track when export modal is opened
  React.useEffect(() => {
    if (open) {
      trackEvent('publish_clicked', { 
        title,
        contentLength: content.length,
        wordCount: content.split(/\s+/).length
      });
    }
  }, [open, trackEvent, title, content]);

  // Export format options
  const formatOptions = [
    {
      value: 'markdown',
      label: 'Markdown (.md)',
      icon: <FileTextOutlined />,
      description: 'Standard markdown format for blogs and documentation',
      extension: 'md'
    },
    {
      value: 'html',
      label: 'HTML (.html)',
      icon: <GlobalOutlined />,
      description: 'Web-ready HTML with styling',
      extension: 'html'
    },
    {
      value: 'plaintext',
      label: 'Plain Text (.txt)', 
      icon: <FileTextOutlined />,
      description: 'Clean text without formatting',
      extension: 'txt'
    },
    {
      value: 'json',
      label: 'JSON (.json)',
      icon: <CodeOutlined />,
      description: 'Structured data format',
      extension: 'json'
    }
  ];

  // Generate filename
  const generateFilename = () => {
    if (customFilename.trim()) {
      return customFilename.trim();
    }
    const selectedFormat = formatOptions.find(f => f.value === exportFormat);
    const cleanTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${cleanTitle}.${selectedFormat?.extension || 'txt'}`;
  };

  // Format content based on selected export type
  const formatContent = () => {
    const selectedFormat = formatOptions.find(f => f.value === exportFormat);
    let formattedContent = content;

    switch (exportFormat) {
      case 'markdown':
        return includeTitle ? `# ${title}\n\n${formattedContent}` : formattedContent;
      
      case 'html':
        const htmlContent = convertMarkdownToHTML(formattedContent);
        const styles = includeFormatting ? generateCSSStyles() : '';
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${includeTitle ? title : 'Blog Post'}</title>
    <style>
        ${styles}
    </style>
</head>
<body>
    ${includeTitle ? `<h1>${title}</h1>` : ''}
    ${htmlContent}
</body>
</html>`;
      
      case 'plaintext':
        const plainText = convertMarkdownToPlainText(formattedContent);
        return includeTitle ? `${title}\n${'='.repeat(title.length)}\n\n${plainText}` : plainText;
      
      case 'json':
        return JSON.stringify({
          title: includeTitle ? title : null,
          content: formattedContent,
          format: 'markdown',
          exportedAt: new Date().toISOString(),
          wordCount: getWordCount(formattedContent),
          typography: includeFormatting ? typography : null
        }, null, 2);
      
      default:
        return formattedContent;
    }
  };

  // Simple markdown to HTML converter
  const convertMarkdownToHTML = (markdown) => {
    return markdown
      .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
      .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, (match) => 
        match.startsWith('<h') || match.startsWith('<ul') || match.startsWith('<li') ? match : `<p>${match}</p>`)
      .replace(/(<p><\/p>)/g, '');
  };

  // Convert markdown to plain text
  const convertMarkdownToPlainText = (markdown) => {
    return markdown
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')
      .replace(/^[*-]\s+/gm, '• ')
      .trim();
  };

  // Generate CSS styles based on typography settings
  const generateCSSStyles = () => {
    const {
      headingFont = 'Inter, sans-serif',
      bodyFont = 'Inter, sans-serif',
      fontSize = 16,
      lineHeight = '1.6',
      paragraphSpacing = 16
    } = typography;

    return `
      body {
        font-family: ${bodyFont};
        font-size: ${fontSize}px;
        line-height: ${lineHeight};
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
        color: #0A2540;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: ${headingFont};
        color: #222;
        margin-top: 2em;
        margin-bottom: 1em;
      }
      h1 { font-size: ${Math.round(fontSize * 2.2)}px; }
      h2 { font-size: ${Math.round(fontSize * 1.8)}px; }
      h3 { font-size: ${Math.round(fontSize * 1.5)}px; }
      p {
        margin-bottom: ${paragraphSpacing}px;
      }
      code {
        background: #f5f5f5;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: Consolas, Monaco, 'Courier New', monospace;
      }
      a {
        color: #6366F1;
        text-decoration: none;
      }
      ul, ol {
        margin-bottom: ${paragraphSpacing}px;
        padding-left: 30px;
      }
      li {
        margin-bottom: ${Math.round(paragraphSpacing / 2)}px;
      }
    `;
  };

  // Word count helper
  const getWordCount = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  // Handle export download
  const handleDownload = () => {
    try {
      // Track export_started event
      trackEvent('export_started', {
        format: exportFormat,
        includeTitle,
        includeFormatting
      }).catch(err => console.error('Failed to track export_started:', err));
      
      const formattedContent = formatContent();
      const filename = generateFilename();
      
      // Track export_format_selected event
      trackEvent('export_format_selected', {
        format: exportFormat
      }).catch(err => console.error('Failed to track export_format_selected:', err));
      
      // Track successful export (export_completed)
      trackEvent('export_completed', {
        format: exportFormat,
        filename,
        contentLength: formattedContent.length,
        wordCount: formattedContent.split(/\s+/).length,
        includeTitle,
        includeFormatting
      }).catch(err => console.error('Failed to track export_completed:', err));
      
      // Also track publish_success for backward compatibility
      trackEvent('publish_success', {
        format: exportFormat,
        filename,
        contentLength: formattedContent.length,
        wordCount: formattedContent.split(/\s+/).length,
        includeTitle,
        includeFormatting
      });
      
      const blob = new Blob([formattedContent], { 
        type: exportFormat === 'html' ? 'text/html' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Track content exported
      api.trackLeadConversion('content_exported', {
        post_title: title,
        content_length: content?.length || 0,
        format: exportFormat,
        filename: filename,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Failed to track content_exported:', err));

      message.success(`Exported as ${filename}`);
      
      // Track workflow_completed when export succeeds
      trackEvent('workflow_completed', {
        format: exportFormat,
        contentLength: formattedContent.length
      }).catch(err => console.error('Failed to track workflow_completed:', err));
    } catch (error) {
      console.error('Export error:', error);
      
      // Track export_failed event
      trackEvent('export_failed', {
        format: exportFormat,
        error: error.message
      }).catch(err => console.error('Failed to track export_failed:', err));
      
      message.error('Failed to export content');
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      const formattedContent = formatContent();
      await navigator.clipboard.writeText(formattedContent);
      message.success('Content copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      message.error('Failed to copy to clipboard');
    }
  };

  return (
    <Modal
      title="Export Content"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Format Selection */}
        <div>
          <Title level={5} style={{ marginBottom: '12px' }}>Export Format</Title>
          <Select
            value={exportFormat}
            onChange={setExportFormat}
            style={{ width: '100%' }}
            size="large"
          >
            {formatOptions.map(format => (
              <Option key={format.value} value={format.value}>
                <Space>
                  {format.icon}
                  <div>
                    <div>{format.label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {format.description}
                    </div>
                  </div>
                </Space>
              </Option>
            ))}
          </Select>
        </div>

        {/* Export Options */}
        <div>
          <Title level={5} style={{ marginBottom: '12px' }}>Options</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Include title</Text>
              <Switch 
                checked={includeTitle} 
                onChange={setIncludeTitle}
              />
            </div>
            {exportFormat === 'html' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Include typography styling</Text>
                <Switch 
                  checked={includeFormatting} 
                  onChange={setIncludeFormatting}
                />
              </div>
            )}
          </Space>
        </div>

        {/* Custom Filename */}
        <div>
          <Title level={5} style={{ marginBottom: '8px' }}>Custom Filename (optional)</Title>
          <Input
            placeholder={generateFilename()}
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            addonAfter={`.${formatOptions.find(f => f.value === exportFormat)?.extension || 'txt'}`}
          />
        </div>

        {/* Preview */}
        <div>
          <Title level={5} style={{ marginBottom: '8px' }}>Preview</Title>
          <TextArea
            value={formatContent()}
            rows={8}
            readOnly
            style={{
              fontFamily: exportFormat === 'json' ? 'Consolas, Monaco, "Courier New", monospace' : 'inherit',
              fontSize: '12px'
            }}
          />
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Export Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button 
            icon={<CopyOutlined />}
            onClick={handleCopy}
          >
            Copy
          </Button>
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>

        {/* Stats */}
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--color-text-secondary)', 
          textAlign: 'center',
          paddingTop: '8px',
          borderTop: '1px solid #f0f0f0'
        }}>
          {getWordCount(content)} words • {Math.max(1, Math.round(getWordCount(content) / 200))} min read
        </div>
      </Space>
    </Modal>
  );
};

export default ExportModal;
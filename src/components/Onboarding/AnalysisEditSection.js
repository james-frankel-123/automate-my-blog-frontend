/**
 * AnalysisEditSection — Inline edit for analysis (business name, target audience, content focus).
 * Shows "What changed?" diff and optional LLM suggestion. Issue #261.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Form, Input, Button, Space, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

const { Text } = Typography;

const EDITABLE_FIELDS = [
  { name: 'businessName', label: 'Business name', key: 'businessName' },
  { name: 'targetAudience', label: 'Target audience', key: 'targetAudience' },
  { name: 'contentFocus', label: 'Content focus', key: 'contentFocus' },
];

export function AnalysisEditSection({
  originalAnalysis = {},
  currentAnalysis = {},
  onApply,
  onCancel,
  onRequestSuggestion,
  dataTestId = 'analysis-edit-section',
}) {
  const [form] = Form.useForm();
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [draftValues, setDraftValues] = useState(null);

  const initialValues = useMemo(
    () => ({
      businessName: currentAnalysis.businessName ?? originalAnalysis.businessName ?? '',
      targetAudience: currentAnalysis.targetAudience ?? originalAnalysis.targetAudience ?? '',
      contentFocus: currentAnalysis.contentFocus ?? originalAnalysis.contentFocus ?? '',
    }),
    [currentAnalysis.businessName, currentAnalysis.targetAudience, currentAnalysis.contentFocus, originalAnalysis.businessName, originalAnalysis.targetAudience, originalAnalysis.contentFocus]
  );

  const watchedValues = draftValues ?? initialValues;
  const onValuesChange = useCallback((_, values) => {
    setDraftValues(values);
  }, []);

  const handleApply = () => {
    form.validateFields().then((values) => {
      onApply?.(values);
    });
  };

  const handleGetSuggestion = async () => {
    if (!onRequestSuggestion) return;
    setSuggestionLoading(true);
    try {
      await onRequestSuggestion(form.getFieldsValue(), form.setFieldsValue);
    } catch (err) {
      // Let parent handle errors (e.g. message.error)
    } finally {
      setSuggestionLoading(false);
    }
  };

  const diff = useMemo(() => {
    const out = [];
    EDITABLE_FIELDS.forEach(({ name, label }) => {
      const orig = originalAnalysis[name] ?? '';
      const cur = watchedValues[name] ?? '';
      if (String(orig).trim() !== String(cur).trim()) {
        out.push({ label, original: orig || '(empty)', edited: cur || '(empty)' });
      }
    });
    return out;
  }, [originalAnalysis, watchedValues]);

  return (
    <div data-testid={dataTestId} style={{ marginTop: 24, padding: 20, background: 'var(--color-background-alt)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-base)' }}>
      <Text strong style={{ display: 'block', marginBottom: 16, color: 'var(--color-text-primary)' }}>
        Edit analysis
      </Text>
      <Form form={form} layout="vertical" initialValues={initialValues} onValuesChange={onValuesChange}>
        {EDITABLE_FIELDS.map(({ name, label }) => (
          <Form.Item key={name} name={name} label={label} rules={[{ required: true, message: `Please enter ${label.toLowerCase()}` }]}>
            <Input placeholder={label} data-testid={`edit-${name}`} />
          </Form.Item>
        ))}
      </Form>

      {diff.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 8, color: 'var(--color-text-secondary)' }}>
            What changed:
          </Text>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--color-text-secondary)', fontSize: 13 }}>
            {diff.map((d, i) => (
              <li key={i} style={{ color: 'var(--color-text-primary)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>{d.label}:</strong>{' '}
                <span style={{ textDecoration: 'line-through', marginRight: 8, color: 'var(--color-text-tertiary)' }}>{d.original}</span>
                {' → '}
                <span style={{ color: 'var(--color-text-primary)' }}>{d.edited}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
          Edit the fields above to see what changed.
        </Text>
      )}

      <Space wrap>
        {onRequestSuggestion && (
          <Button
            icon={<ThunderboltOutlined />}
            onClick={handleGetSuggestion}
            loading={suggestionLoading}
            disabled={suggestionLoading}
            data-testid="get-suggestion-btn"
          >
            {suggestionLoading ? 'Getting suggestion…' : 'Get suggestion'}
          </Button>
        )}
        <Button onClick={onCancel} data-testid="edit-cancel-btn">
          Cancel
        </Button>
        <Button type="primary" onClick={handleApply} data-testid="edit-apply-btn">
          Apply changes
        </Button>
      </Space>
    </div>
  );
}

export default AnalysisEditSection;

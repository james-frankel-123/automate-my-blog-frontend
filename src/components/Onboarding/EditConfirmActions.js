/**
 * EditConfirmActions — Edit and Confirm & Continue below analysis carousel.
 * Confirm unlocks next section. Issue #261.
 */
import React from 'react';
import { Button, Space } from 'antd';
import { EditOutlined, CheckOutlined } from '@ant-design/icons';

export function EditConfirmActions({
  onEdit,
  onConfirm,
  editMode: _editMode = false,
  loading = false,
  dataTestId = 'edit-confirm-actions',
}) {
  return (
    <div data-testid={dataTestId} style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
      <Space>
        {onEdit && (
          <Button
            icon={<EditOutlined />}
            onClick={onEdit}
            data-testid="edit-analysis-btn"
          >
            Edit
          </Button>
        )}
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={onConfirm}
          loading={loading}
          data-testid="confirm-analysis-btn"
        >
          Confirm & Continue
        </Button>
      </Space>
    </div>
  );
}

export default EditConfirmActions;

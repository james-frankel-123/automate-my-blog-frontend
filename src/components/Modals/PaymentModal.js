import React from 'react';
import { Modal } from 'antd';
import { EmbeddedCheckoutComponent } from '../Checkout/EmbeddedCheckout';

/**
 * PaymentModal
 *
 * Displays Stripe's embedded checkout in an Ant Design modal.
 * Users stay on the application domain throughout the payment flow.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {string} props.clientSecret - Stripe checkout session client secret
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {string} props.title - Optional modal title (defaults to "Complete Your Purchase")
 */
export const PaymentModal = ({ visible, clientSecret, onClose, title = "Complete Your Purchase" }) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      maskClosable={false}  // Prevent closing during payment
      closable={true}
      title={title}
      destroyOnClose={true}  // Clean up Stripe Elements when modal closes
      style={{ maxWidth: '90vw' }}
      bodyStyle={{
        maxHeight: '80vh',
        overflowY: 'auto',
        padding: '24px'
      }}
    >
      <EmbeddedCheckoutComponent
        clientSecret={clientSecret}
        onError={(error) => {
          console.error('Embedded checkout error:', error);
        }}
      />
    </Modal>
  );
};

export default PaymentModal;

// Mock for antd library
import React from 'react';

// Layout components
export const Layout = ({ children, ...props }) => <div data-testid="layout" {...props}>{children}</div>;
Layout.Header = ({ children, ...props }) => <header data-testid="header" {...props}>{children}</header>;
Layout.Sider = ({ children, ...props }) => <aside data-testid="sider" {...props}>{children}</aside>;
Layout.Content = ({ children, ...props }) => <main data-testid="content" {...props}>{children}</main>;
Layout.Footer = ({ children, ...props }) => <footer data-testid="footer" {...props}>{children}</footer>;

// Basic components
export const Button = ({ children, onClick, htmlType, type, loading, disabled, icon, size, danger, ...props }) => (
  <button 
    type={htmlType || 'button'} 
    onClick={onClick}
    disabled={disabled || loading}
    data-testid="button"
    {...props}
  >
    {icon}{children}
  </button>
);

export const Input = React.forwardRef(({ prefix, suffix, onChange, value, placeholder, size, ...props }, ref) => (
  <div data-testid="input-wrapper">
    {prefix}
    <input 
      ref={ref}
      onChange={onChange} 
      value={value} 
      placeholder={placeholder}
      {...props}
    />
    {suffix}
  </div>
));
Input.Password = React.forwardRef(({ prefix, ...props }, ref) => (
  <div data-testid="password-wrapper">
    {prefix}
    <input ref={ref} type="password" {...props} />
  </div>
));
Input.TextArea = React.forwardRef((props, ref) => (
  <textarea ref={ref} data-testid="textarea" {...props} />
));
Input.Search = React.forwardRef((props, ref) => (
  <input ref={ref} data-testid="search-input" {...props} />
));

export const Form = ({ children, onFinish, name, layout, ...props }) => (
  <form 
    data-testid="form" 
    onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const values = {};
      formData.forEach((value, key) => {
        values[key] = value;
      });
      onFinish?.(values);
    }}
    {...props}
  >
    {children}
  </form>
);
Form.Item = ({ children, name, label, rules, ...props }) => (
  <div data-testid={`form-item-${name || 'unknown'}`} {...props}>
    {label && <label>{label}</label>}
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { name });
      }
      return child;
    })}
  </div>
);
Form.useForm = () => [{ getFieldsValue: () => ({}), setFieldsValue: () => {}, resetFields: () => {} }, {}];

export const Alert = ({ message, type, description, ...props }) => (
  <div role="alert" data-testid="alert" data-type={type} {...props}>
    {message}
    {description && <div>{description}</div>}
  </div>
);

export const Space = ({ children, direction, size, ...props }) => (
  <div data-testid="space" style={{ display: 'flex', flexDirection: direction === 'vertical' ? 'column' : 'row' }} {...props}>
    {children}
  </div>
);

export const Tag = ({ children, color, icon, ...props }) => (
  <span data-testid="tag" data-color={color} {...props}>
    {icon}
    {children}
  </span>
);

export const Typography = {
  Text: ({ children, type, strong, ...props }) => <span data-testid="text" {...props}>{children}</span>,
  Title: ({ children, level, ...props }) => {
    const Tag = `h${level || 1}`;
    return <Tag data-testid="title" {...props}>{children}</Tag>;
  },
  Paragraph: ({ children, ...props }) => <p data-testid="paragraph" {...props}>{children}</p>,
  Link: ({ children, ...props }) => <a data-testid="link" {...props}>{children}</a>,
};

export const Drawer = ({ open, onClose, children, title, placement, width, bodyStyle, headerStyle, styles, ...props }) => {
  if (!open) return null;
  return (
    <div data-testid="drawer" data-placement={placement} style={{ width: width || 280 }} {...props}>
      {title != null && <div data-testid="drawer-title">{title}</div>}
      <button data-testid="drawer-close" onClick={onClose} type="button">Close</button>
      <div data-testid="drawer-body" style={bodyStyle}>{children}</div>
    </div>
  );
};

export const Modal = ({ open, visible, children, onCancel, onOk, title, footer, ...props }) => {
  if (!open && !visible) return null;
  return (
    <div data-testid="modal" role="dialog" {...props}>
      {title && <div data-testid="modal-title">{title}</div>}
      <button data-testid="modal-close" onClick={onCancel}>Close</button>
      <div data-testid="modal-content">{children}</div>
      {footer !== null && (
        <div data-testid="modal-footer">
          {footer || (
            <>
              <button onClick={onCancel}>Cancel</button>
              <button onClick={onOk}>OK</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const Tabs = ({ items, activeKey, onChange, defaultActiveKey, centered, ...props }) => {
  const [active, setActive] = React.useState(activeKey || defaultActiveKey || items?.[0]?.key);
  
  React.useEffect(() => {
    if (activeKey) setActive(activeKey);
  }, [activeKey]);
  
  const handleChange = (key) => {
    setActive(key);
    onChange?.(key);
  };
  
  return (
    <div data-testid="tabs" {...props}>
      <div role="tablist">
        {items?.map((item) => (
          <button
            key={item.key}
            role="tab"
            onClick={() => handleChange(item.key)}
            data-active={active === item.key}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {items?.find((item) => item.key === active)?.children}
      </div>
    </div>
  );
};

export const Menu = ({ items, onClick, selectedKeys, mode, ...props }) => (
  <nav data-testid="menu" {...props}>
    {items?.map((item) => (
      <button
        key={item.key}
        onClick={() => onClick?.({ key: item.key })}
        data-selected={selectedKeys?.includes(item.key)}
      >
        {item.icon}
        {item.label}
      </button>
    ))}
  </nav>
);

export const Dropdown = ({ children, menu, trigger, placement, ...props }) => (
  <div data-testid="dropdown" {...props}>
    {children}
  </div>
);

export const Avatar = ({ icon, src, size, ...props }) => (
  <span data-testid="avatar" {...props}>{icon}</span>
);

export const Badge = ({ children, count, showZero, ...props }) => (
  <span data-testid="badge" {...props}>
    {children}
    {(count > 0 || showZero) && <span data-testid="badge-count">{count}</span>}
  </span>
);

export const Spin = ({ spinning, children, size, tip, ...props }) => (
  <div data-testid="spin" data-spinning={spinning} {...props}>
    {tip && <span>{tip}</span>}
    {children}
  </div>
);

export const Empty = ({ description, image, imageStyle, children, ...props }) => (
  <div data-testid="empty" {...props}>
    {image}
    {description && <div data-testid="empty-description">{description}</div>}
    {children}
  </div>
);
Empty.PRESENTED_IMAGE_SIMPLE = 'simple';

export const Skeleton = ({ active, paragraph, title, children, ...props }) => (
  <div data-testid="skeleton" data-active={active} {...props}>
    {title !== false && <div data-testid="skeleton-title" />}
    {paragraph && <div data-testid="skeleton-paragraph" />}
    {children}
  </div>
);

export const Card = ({ children, title, extra, bodyStyle, ...props }) => (
  <div data-testid="card" {...props}>
    {title && <div data-testid="card-title">{title}</div>}
    {extra && <div data-testid="card-extra">{extra}</div>}
    {children}
  </div>
);

export const Row = ({ children, gutter, ...props }) => (
  <div data-testid="row" style={{ display: 'flex', flexWrap: 'wrap' }} {...props}>{children}</div>
);

export const Col = ({ children, span, ...props }) => (
  <div data-testid="col" style={{ width: span ? `${(span / 24) * 100}%` : 'auto' }} {...props}>{children}</div>
);

export const Progress = ({ percent, ...props }) => (
  <div data-testid="progress" data-percent={percent} {...props} />
);

export const Select = ({ children, onChange, value, options, placeholder, ...props }) => (
  <select 
    data-testid="select" 
    onChange={(e) => onChange?.(e.target.value)} 
    value={value}
    {...props}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options?.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export const Radio = ({ children, ...props }) => (
  <label data-testid="radio" {...props}>
    <input type="radio" {...props} />
    {children}
  </label>
);
Radio.Group = ({ children, onChange, value, ...props }) => (
  <div data-testid="radio-group" {...props}>{children}</div>
);
Radio.Button = ({ children, value, ...props }) => (
  <button data-testid="radio-button" data-value={value} {...props}>{children}</button>
);

export const Checkbox = ({ children, onChange, checked, ...props }) => (
  <label data-testid="checkbox" {...props}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    {children}
  </label>
);
Checkbox.Group = ({ children, ...props }) => (
  <div data-testid="checkbox-group" {...props}>{children}</div>
);

export const message = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
};

export const notification = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  open: jest.fn(),
};

export const Table = ({ dataSource, columns, ...props }) => (
  <table data-testid="table" {...props}>
    <thead>
      <tr>
        {columns?.map((col) => (
          <th key={col.key || col.dataIndex}>{col.title}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {dataSource?.map((row, index) => (
        <tr key={row.key || index}>
          {columns?.map((col) => (
            <td key={col.key || col.dataIndex}>
              {col.render ? col.render(row[col.dataIndex], row, index) : row[col.dataIndex]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export const Divider = ({ children, ...props }) => (
  <hr data-testid="divider" {...props} />
);

export const Steps = ({ current, items, ...props }) => (
  <div data-testid="steps" data-current={current} {...props}>
    {items?.map((item, index) => (
      <div key={index} data-testid={`step-${index}`} data-status={index < current ? 'finish' : index === current ? 'process' : 'wait'}>
        {item.title}
      </div>
    ))}
  </div>
);

export const Collapse = ({ items, ...props }) => (
  <div data-testid="collapse" {...props}>
    {items?.map((item) => (
      <div key={item.key} data-testid={`collapse-item-${item.key}`}>
        <div>{item.label}</div>
        <div>{item.children}</div>
      </div>
    ))}
  </div>
);

export const Tooltip = ({ children, title, ...props }) => (
  <span data-testid="tooltip" title={title} {...props}>{children}</span>
);

export const Popover = ({ children, content, title, ...props }) => (
  <span data-testid="popover" {...props}>{children}</span>
);

export const DatePicker = ({ onChange, value, ...props }) => (
  <input type="date" data-testid="datepicker" onChange={onChange} value={value} {...props} />
);

export const ColorPicker = ({ value, onChange, ...props }) => (
  <input type="color" data-testid="colorpicker" value={value} onChange={(e) => onChange?.(e.target.value)} {...props} />
);

export const Slider = ({ value, onChange, ...props }) => (
  <input type="range" data-testid="slider" value={value} onChange={(e) => onChange?.(Number(e.target.value))} {...props} />
);

// ConfigProvider
export const ConfigProvider = ({ children }) => <>{children}</>;

// Theme
export const theme = {
  useToken: () => ({ token: {} }),
  defaultAlgorithm: {},
  darkAlgorithm: {},
};

export default {
  Layout,
  Button,
  Input,
  Form,
  Alert,
  Space,
  Tag,
  Typography,
  Drawer,
  Modal,
  Tabs,
  Menu,
  Dropdown,
  Avatar,
  Badge,
  Spin,
  Empty,
  Skeleton,
  Card,
  Row,
  Col,
  Progress,
  Select,
  Radio,
  Checkbox,
  message,
  notification,
  Table,
  Divider,
  Steps,
  Collapse,
  Tooltip,
  Popover,
  DatePicker,
  ColorPicker,
  Slider,
  ConfigProvider,
  theme,
};

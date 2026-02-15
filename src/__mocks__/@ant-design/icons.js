// Mock for @ant-design/icons
import React from 'react';

// Helper to create icon mock
const createIcon = (name) => {
  const Icon = React.forwardRef((props, ref) => (
    <span ref={ref} role="img" aria-label={name} data-testid={`icon-${name}`} {...props} />
  ));
  Icon.displayName = name;
  return Icon;
};

// Common icons used in the app
export const DashboardOutlined = createIcon('DashboardOutlined');
export const FileTextOutlined = createIcon('FileTextOutlined');
export const SettingOutlined = createIcon('SettingOutlined');
export const SoundOutlined = createIcon('SoundOutlined');
export const UserOutlined = createIcon('UserOutlined');
export const LogoutOutlined = createIcon('LogoutOutlined');
export const EditOutlined = createIcon('EditOutlined');
export const TeamOutlined = createIcon('TeamOutlined');
export const LineChartOutlined = createIcon('LineChartOutlined');
export const SafetyOutlined = createIcon('SafetyOutlined');
export const DatabaseOutlined = createIcon('DatabaseOutlined');
export const UserSwitchOutlined = createIcon('UserSwitchOutlined');
export const CloseOutlined = createIcon('CloseOutlined');
export const PlusOutlined = createIcon('PlusOutlined');
export const BarChartOutlined = createIcon('BarChartOutlined');
export const LockOutlined = createIcon('LockOutlined');
export const StarOutlined = createIcon('StarOutlined');
export const ThunderboltOutlined = createIcon('ThunderboltOutlined');
export const SearchOutlined = createIcon('SearchOutlined');
export const BulbOutlined = createIcon('BulbOutlined');
export const CheckOutlined = createIcon('CheckOutlined');
export const ReloadOutlined = createIcon('ReloadOutlined');
export const GlobalOutlined = createIcon('GlobalOutlined');
export const ScanOutlined = createIcon('ScanOutlined');
export const EyeOutlined = createIcon('EyeOutlined');
export const ApiOutlined = createIcon('ApiOutlined');
export const CloudUploadOutlined = createIcon('CloudUploadOutlined');
export const CodeOutlined = createIcon('CodeOutlined');
export const DownOutlined = createIcon('DownOutlined');
export const CloudDownloadOutlined = createIcon('CloudDownloadOutlined');
export const FileMarkdownOutlined = createIcon('FileMarkdownOutlined');
export const FileZipOutlined = createIcon('FileZipOutlined');
export const LoadingOutlined = createIcon('LoadingOutlined');
export const MenuOutlined = createIcon('MenuOutlined');
export const HomeOutlined = createIcon('HomeOutlined');
export const RightOutlined = createIcon('RightOutlined');
export const LeftOutlined = createIcon('LeftOutlined');
export const UpOutlined = createIcon('UpOutlined');
export const InfoCircleOutlined = createIcon('InfoCircleOutlined');
export const ExclamationCircleOutlined = createIcon('ExclamationCircleOutlined');
export const CheckCircleOutlined = createIcon('CheckCircleOutlined');
export const CloseCircleOutlined = createIcon('CloseCircleOutlined');
export const WarningOutlined = createIcon('WarningOutlined');
export const QuestionCircleOutlined = createIcon('QuestionCircleOutlined');
export const CopyOutlined = createIcon('CopyOutlined');
export const BranchesOutlined = createIcon('BranchesOutlined');
export const DeleteOutlined = createIcon('DeleteOutlined');
export const MailOutlined = createIcon('MailOutlined');
export const SendOutlined = createIcon('SendOutlined');
export const SaveOutlined = createIcon('SaveOutlined');
export const DownloadOutlined = createIcon('DownloadOutlined');
export const UploadOutlined = createIcon('UploadOutlined');
export const ShareAltOutlined = createIcon('ShareAltOutlined');
export const LinkOutlined = createIcon('LinkOutlined');
export const SyncOutlined = createIcon('SyncOutlined');
export const CalendarOutlined = createIcon('CalendarOutlined');
export const ClockCircleOutlined = createIcon('ClockCircleOutlined');
export const FilterOutlined = createIcon('FilterOutlined');
export const SortAscendingOutlined = createIcon('SortAscendingOutlined');
export const SortDescendingOutlined = createIcon('SortDescendingOutlined');
export const ExpandOutlined = createIcon('ExpandOutlined');
export const CompressOutlined = createIcon('CompressOutlined');
export const FullscreenOutlined = createIcon('FullscreenOutlined');
export const FullscreenExitOutlined = createIcon('FullscreenExitOutlined');
export const ArrowLeftOutlined = createIcon('ArrowLeftOutlined');
export const ArrowRightOutlined = createIcon('ArrowRightOutlined');
export const ArrowUpOutlined = createIcon('ArrowUpOutlined');
export const ArrowDownOutlined = createIcon('ArrowDownOutlined');
export const PlayCircleOutlined = createIcon('PlayCircleOutlined');
export const PauseCircleOutlined = createIcon('PauseCircleOutlined');
export const StopOutlined = createIcon('StopOutlined');
export const UndoOutlined = createIcon('UndoOutlined');
export const RedoOutlined = createIcon('RedoOutlined');
export const HistoryOutlined = createIcon('HistoryOutlined');
export const BoldOutlined = createIcon('BoldOutlined');
export const ItalicOutlined = createIcon('ItalicOutlined');
export const UnderlineOutlined = createIcon('UnderlineOutlined');
export const StrikethroughOutlined = createIcon('StrikethroughOutlined');
export const OrderedListOutlined = createIcon('OrderedListOutlined');
export const UnorderedListOutlined = createIcon('UnorderedListOutlined');
export const AlignLeftOutlined = createIcon('AlignLeftOutlined');
export const AlignCenterOutlined = createIcon('AlignCenterOutlined');
export const AlignRightOutlined = createIcon('AlignRightOutlined');
export const PictureOutlined = createIcon('PictureOutlined');
export const TableOutlined = createIcon('TableOutlined');
export const FontSizeOutlined = createIcon('FontSizeOutlined');
export const FontColorsOutlined = createIcon('FontColorsOutlined');
export const BgColorsOutlined = createIcon('BgColorsOutlined');
export const HighlightOutlined = createIcon('HighlightOutlined');

export default {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  SoundOutlined,
  UserOutlined,
  LogoutOutlined,
  EditOutlined,
  TeamOutlined,
  LineChartOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  UserSwitchOutlined,
  CloseOutlined,
  PlusOutlined,
  BarChartOutlined,
  LockOutlined,
  StarOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  BulbOutlined,
  CheckOutlined,
  ReloadOutlined,
  GlobalOutlined,
  ScanOutlined,
  EyeOutlined,
  ApiOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  DownOutlined,
  CloudDownloadOutlined,
  FileMarkdownOutlined,
  FileZipOutlined,
  LoadingOutlined,
  MenuOutlined,
  HomeOutlined,
  RightOutlined,
  LeftOutlined,
  UpOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  QuestionCircleOutlined,
  CopyOutlined,
  BranchesOutlined,
  DeleteOutlined,
  MailOutlined,
  SendOutlined,
  SaveOutlined,
  DownloadOutlined,
  UploadOutlined,
  ShareAltOutlined,
  LinkOutlined,
  SyncOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ExpandOutlined,
  CompressOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  UndoOutlined,
  RedoOutlined,
  HistoryOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  PictureOutlined,
  TableOutlined,
  FontSizeOutlined,
  FontColorsOutlined,
  BgColorsOutlined,
  HighlightOutlined,
};

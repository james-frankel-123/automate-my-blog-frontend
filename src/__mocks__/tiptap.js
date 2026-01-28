// Mock for @tiptap packages
import React from 'react';

export const useEditor = () => ({
  commands: {
    setContent: jest.fn(),
    clearContent: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    toggleBold: jest.fn(),
    toggleItalic: jest.fn(),
    toggleUnderline: jest.fn(),
    toggleStrike: jest.fn(),
    toggleBulletList: jest.fn(),
    toggleOrderedList: jest.fn(),
    setTextAlign: jest.fn(),
    setFontFamily: jest.fn(),
    setColor: jest.fn(),
    insertTable: jest.fn(),
    addColumnAfter: jest.fn(),
    addRowAfter: jest.fn(),
    deleteTable: jest.fn(),
    insertContent: jest.fn(),
    setLink: jest.fn(),
    unsetLink: jest.fn(),
  },
  isActive: jest.fn(() => false),
  getHTML: jest.fn(() => ''),
  getText: jest.fn(() => ''),
  getJSON: jest.fn(() => ({})),
  isEmpty: true,
  isFocused: false,
  isEditable: true,
  can: () => ({
    toggleBold: () => true,
    toggleItalic: () => true,
    toggleUnderline: () => true,
  }),
  chain: () => ({
    focus: () => ({
      toggleBold: () => ({ run: jest.fn() }),
      toggleItalic: () => ({ run: jest.fn() }),
      run: jest.fn(),
    }),
  }),
  on: jest.fn(),
  off: jest.fn(),
  destroy: jest.fn(),
});

export const EditorContent = ({ editor, ...props }) => (
  <div data-testid="tiptap-editor" {...props}>
    <div contentEditable="true" data-testid="editor-content" />
  </div>
);

export const Editor = () => null;
export const Extension = { create: () => ({}) };
export const Node = { create: () => ({}) };
export const Mark = { create: () => ({}) };

// StarterKit
export const StarterKit = { configure: () => ({}) };

// Extensions
export const TextStyle = { configure: () => ({}) };
export const Color = { configure: () => ({}) };
export const FontFamily = { configure: () => ({}) };
export const TextAlign = { configure: () => ({}) };
export const Underline = { configure: () => ({}) };
export const Link = { configure: () => ({}) };
export const Image = { configure: () => ({}) };
export const Placeholder = { configure: () => ({}) };
export const Table = { configure: () => ({}) };
export const TableRow = { configure: () => ({}) };
export const TableCell = { configure: () => ({}) };
export const TableHeader = { configure: () => ({}) };

export default {
  useEditor,
  EditorContent,
  Editor,
  Extension,
  Node,
  Mark,
  StarterKit,
  TextStyle,
  Color,
  FontFamily,
  TextAlign,
  Underline,
  Link,
  Image,
  Placeholder,
  Table,
  TableRow,
  TableCell,
  TableHeader,
};

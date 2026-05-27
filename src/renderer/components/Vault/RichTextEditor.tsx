// StealthNode — Rich Text Editor (Tiptap-based Notepad)
import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'

interface Props {
  content: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'code-block' } },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
    ],
    content: content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div>
      {/* Toolbar */}
      <div className="tiptap-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''} title="Italic (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''} title="Underline (Ctrl+U)">
          <u>U</u>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough">
          <s>S</s>
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} title="Heading 1">
          H1
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2">
          H2
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3">
          H3
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet List">
          •
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''} title="Ordered List">
          1.
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''} title="Quote">
          ❝
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''} title="Code Block">
          {'</>'}
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'is-active' : ''} title="Highlight">
          🖍
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          ―
        </button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
          ↩
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
          ↪
        </button>
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} />
    </div>
  )
}

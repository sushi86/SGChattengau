'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-sm min-h-[36px] min-w-[36px] transition-colors ${
      active ? 'bg-primary text-white' : 'bg-white text-text-body hover:bg-section-alt border border-border'
    }`

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-section-alt rounded-t-md">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
        <em>I</em>
      </button>
      <span className="w-px h-6 bg-border self-center mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))}>
        H3
      </button>
      <span className="w-px h-6 bg-border self-center mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
        Liste
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>
        1. Liste
      </button>
      <span className="w-px h-6 bg-border self-center mx-1" />
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('URL eingeben:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
        className={btnClass(editor.isActive('link'))}
      >
        Link
      </button>
      {editor.isActive('link') && (
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btnClass(false)}>
          Unlink
        </button>
      )}
    </div>
  )
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none',
      },
    },
  })

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

import React, { useRef, useEffect } from 'react';
import { BoldIcon, ItalicIcon, ListIcon } from './Icons';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only update innerHTML if the change comes from an external source (like props update)
    // to avoid resetting cursor position during user input.
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleCommand = (command: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      if (command === 'insertUnorderedList') {
        // Manuelle Implementierung für Aufzählungen
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const listItem = document.createElement('li');
          listItem.textContent = '• ';
          
          // Füge das Listenelement ein
          range.deleteContents();
          range.insertNode(listItem);
          
          // Setze den Cursor nach dem Bullet Point
          range.setStartAfter(listItem);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // Verwende execCommand für andere Befehle
        document.execCommand(command, false);
      }
      
      // Manually trigger onChange after a command to update parent state
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const ToolbarButton = ({ command, children }: {command: string, children: React.ReactNode}) => (
    <button
      type="button"
      onMouseDown={(e) => {
          e.preventDefault(); // Prevent editor from losing focus
          handleCommand(command)
      }}
      className="p-2 rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800"
      aria-label={command}
    >
        {children}
    </button>
  );

  return (
    <div className="border border-slate-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
      <div className="flex items-center gap-1 p-1 border-b border-slate-200 bg-slate-50 rounded-t-md">
        <ToolbarButton command="bold"><BoldIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton command="italic"><ItalicIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton command="insertUnorderedList"><ListIcon className="w-4 h-4" /></ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="prose prose-sm max-w-none w-full min-h-[100px] p-3 focus:outline-none overflow-y-auto"
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
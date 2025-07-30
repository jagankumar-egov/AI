import React from 'react';
import Editor from '@monaco-editor/react';

const MonacoEditor = ({ value, onChange, language = 'json', height = '400px' }) => {
  const handleEditorChange = (value) => {
    onChange(value);
  };

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        theme: 'vs-dark',
      }}
    />
  );
};

export default MonacoEditor; 
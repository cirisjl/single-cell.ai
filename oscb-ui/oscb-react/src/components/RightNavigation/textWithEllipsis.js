import React from 'react';

const TextWithEllipsis = ({ text, maxLength }) => {

  const displayText = text.length > maxLength ? text.slice(0, maxLength) : text;

  return (
    <div className="text-container">
      <div className="text-content" title={text}>
        {displayText}{text.length > maxLength && <span className="ellipsis"> ...</span>}
      </div>
    </div>
  );
};

export default TextWithEllipsis;

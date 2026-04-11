import React from 'react';

function LogComponent({ wsLogs }) {

  // A utility function to safely sanitize logs before using dangerouslySetInnerHTML
  const createMarkup = (logs) => {
    return { __html: logs };
  };

  return (
    <div className="live_logs_container">
      <div className="live_logs_card">
        <h2 className="live_logs_header">Live Logs</h2>
      </div>
      <div className="live_logs_content" id = "_live_logs">
        <div dangerouslySetInnerHTML={createMarkup(wsLogs || 'No Live logs...')} />
      </div>
    </div>
  );
}


export default LogComponent;

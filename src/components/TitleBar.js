import React from 'react';

function TitleBar() {
  const handleMinimize = () => window.electronAPI.window.minimize();
  const handleMaximize = () => window.electronAPI.window.maximize();
  const handleClose = () => window.electronAPI.window.close();

  return (
    <div className="titlebar d-flex align-items-center justify-content-between">
      <div className="titlebar-drag d-flex align-items-center flex-grow-1">
        <i className="fas fa-wallet ms-3 me-2"></i>
        <span className="fw-bold">Finance Tracker</span>
      </div>
      <div className="titlebar-controls d-flex">
        <button
          className="titlebar-btn"
          onClick={handleMinimize}
          title="Minimize"
        >
          <i className="fas fa-minus"></i>
        </button>
        <button
          className="titlebar-btn"
          onClick={handleMaximize}
          title="Maximize"
        >
          <i className="far fa-square"></i>
        </button>
        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={handleClose}
          title="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;

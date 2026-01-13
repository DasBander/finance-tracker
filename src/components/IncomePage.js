import React, { useState, useEffect } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBInput,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBBadge,
  MDBRow,
  MDBCol
} from 'mdb-react-ui-kit';

const COLLECTION_NAME = 'income';

function IncomePage({ onDataChange, providers, currency }) {
  const [items, setItems] = useState([]);
  const [itemImages, setItemImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [provider, setProvider] = useState('');
  const [iconPath, setIconPath] = useState('');
  const [iconPreview, setIconPreview] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const result = await window.electronAPI.db.getAll(COLLECTION_NAME);
    if (result.success) {
      setItems(result.data);
      loadItemImages(result.data);
    }
    setLoading(false);
  };

  const loadItemImages = async (itemsList) => {
    const images = {};
    for (const item of itemsList) {
      if (item.icon) {
        const result = await window.electronAPI.image.get(item.icon);
        if (result.success) {
          images[item.id || item._id] = result.data;
        }
      }
    }
    setItemImages(images);
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('');
    setProvider('');
    setIconPath('');
    setIconPreview(null);
    setEditItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = async (item) => {
    setEditItem(item);
    setDescription(item.description || '');
    setAmount(item.amount?.toString() || '');
    setDate(item.date || new Date().toISOString().split('T')[0]);
    setCategory(item.category || '');
    setProvider(item.provider || '');
    setIconPath(item.icon || '');

    if (item.icon) {
      const result = await window.electronAPI.image.get(item.icon);
      if (result.success) {
        setIconPreview(result.data);
      }
    } else {
      setIconPreview(null);
    }

    setShowModal(true);
  };

  const handleUploadIcon = async () => {
    const result = await window.electronAPI.image.upload('income');
    if (result.success) {
      setIconPath(result.imageKey);
      const imgResult = await window.electronAPI.image.get(result.imageKey);
      if (imgResult.success) {
        setIconPreview(imgResult.data);
      }
    }
  };

  const handleRemoveIcon = () => {
    setIconPath('');
    setIconPreview(null);
  };

  const handleSubmit = async () => {
    if (!description.trim() || !amount) return;

    const data = {
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      category: category.trim(),
      provider: provider.trim(),
      icon: iconPath
    };

    let result;
    if (editItem) {
      result = await window.electronAPI.db.update(COLLECTION_NAME, editItem.id || editItem._id, data);
    } else {
      result = await window.electronAPI.db.insert(COLLECTION_NAME, data);
    }

    if (result.success) {
      setShowModal(false);
      resetForm();
      fetchItems();
      onDataChange();
    }
  };

  const handleDelete = async (item) => {
    const id = item.id || item._id;
    const result = await window.electronAPI.db.delete(COLLECTION_NAME, id);
    if (result.success) {
      fetchItems();
      onDataChange();
    }
  };

  const handleExportCSV = async () => {
    if (items.length === 0) return;

    const headers = ['Date', 'Description', 'Category', 'Provider', 'Amount'];
    const rows = items.map(item => [
      item.date || '',
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.provider || '').replace(/"/g, '""')}"`,
      item.amount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const today = new Date().toISOString().split('T')[0];
    await window.electronAPI.export.csv(csvContent, `income_export_${today}.csv`);
  };

  const formatCurrency = (amount) => {
    if (currency === 'EUR') {
      return (amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
    }
    return '$' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const totalIncome = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0 fw-bold">
          <i className="fas fa-arrow-down me-2 text-success"></i>
          Income Stream
        </h4>
        <div>
          <MDBBtn color="secondary" className="me-2" onClick={handleExportCSV} disabled={items.length === 0}>
            <i className="fas fa-file-csv me-2"></i>
            Export CSV
          </MDBBtn>
          <MDBBtn color="success" onClick={openAddModal}>
            <i className="fas fa-plus me-2"></i>
            Add Income
          </MDBBtn>
        </div>
      </div>

      {/* Summary Card */}
      <MDBCard className="border-0 shadow-sm mb-4 bg-success bg-opacity-10">
        <MDBCardBody>
          <MDBRow>
            <MDBCol>
              <small className="text-muted">
                <i className="fas fa-coins me-1"></i> Total Income
              </small>
              <h3 className="text-success fw-bold mb-0">{formatCurrency(totalIncome)}</h3>
            </MDBCol>
            <MDBCol className="text-end">
              <small className="text-muted">
                <i className="fas fa-list me-1"></i> Entries
              </small>
              <h3 className="fw-bold mb-0">{items.length}</h3>
            </MDBCol>
          </MDBRow>
        </MDBCardBody>
      </MDBCard>

      {/* Income Table */}
      <MDBCard className="border-0 shadow-sm">
        <MDBCardBody>
          {loading ? (
            <div className="text-center py-4">
              <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="fas fa-inbox fa-3x mb-3"></i>
              <p>No income entries yet. Click "Add Income" to get started.</p>
            </div>
          ) : (
            <MDBTable hover responsive>
              <MDBTableHead light>
                <tr>
                  <th style={{ width: 50 }}></th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Provider</th>
                  <th>Date</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </MDBTableHead>
              <MDBTableBody>
                {items.map((item) => {
                  const itemId = item.id || item._id;
                  return (
                    <tr key={itemId}>
                      <td>
                        {itemImages[itemId] ? (
                          <img
                            src={itemImages[itemId]}
                            alt=""
                            className="rounded"
                            style={{ width: 36, height: 36, objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="rounded bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                            <i className="fas fa-coins text-success"></i>
                          </div>
                        )}
                      </td>
                      <td className="fw-bold">{item.description}</td>
                      <td>
                        {item.category && (
                          <MDBBadge color="light" className="text-dark">
                            <i className="fas fa-tag me-1"></i>{item.category}
                          </MDBBadge>
                        )}
                      </td>
                      <td>{item.provider || '-'}</td>
                      <td>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                      <td className="text-end text-success fw-bold">
                        +{formatCurrency(item.amount)}
                      </td>
                      <td className="text-center">
                        <MDBBtn
                          size="sm"
                          color="link"
                          className="text-warning p-1"
                          onClick={() => openEditModal(item)}
                        >
                          <i className="fas fa-edit"></i>
                        </MDBBtn>
                        <MDBBtn
                          size="sm"
                          color="link"
                          className="text-danger p-1"
                          onClick={() => handleDelete(item)}
                        >
                          <i className="fas fa-trash"></i>
                        </MDBBtn>
                      </td>
                    </tr>
                  );
                })}
              </MDBTableBody>
            </MDBTable>
          )}
        </MDBCardBody>
      </MDBCard>

      {/* Add/Edit Modal */}
      <MDBModal open={showModal} setOpen={setShowModal} tabIndex="-1">
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader className="bg-success text-white">
              <MDBModalTitle>
                <i className={`fas fa-${editItem ? 'edit' : 'plus'} me-2`}></i>
                {editItem ? 'Edit Income' : 'Add Income'}
              </MDBModalTitle>
              <MDBBtn className="btn-close btn-close-white" color="none" onClick={() => setShowModal(false)} />
            </MDBModalHeader>
            <MDBModalBody className="p-4">
              {/* Icon Upload */}
              <div className="text-center mb-4">
                <div
                  className="rounded d-inline-flex align-items-center justify-content-center overflow-hidden mx-auto"
                  style={{
                    width: 80,
                    height: 80,
                    background: iconPreview ? 'transparent' : 'rgba(25, 135, 84, 0.1)',
                    cursor: 'pointer',
                    border: '2px dashed #198754'
                  }}
                  onClick={handleUploadIcon}
                >
                  {iconPreview ? (
                    <img src={iconPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-camera text-success fa-2x"></i>
                  )}
                </div>
                <div className="mt-2">
                  <MDBBtn size="sm" color="link" onClick={handleUploadIcon}>
                    <i className="fas fa-upload me-1"></i>Upload Icon
                  </MDBBtn>
                  {iconPreview && (
                    <MDBBtn size="sm" color="link" className="text-danger" onClick={handleRemoveIcon}>
                      <i className="fas fa-times me-1"></i>Remove
                    </MDBBtn>
                  )}
                </div>
              </div>

              <MDBInput
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mb-4"
                required
              />
              <MDBInput
                label={`Amount (${currency === 'EUR' ? '€' : '$'})`}
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mb-4"
                required
              />
              <MDBInput
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mb-4"
              />
              <MDBInput
                label="Category (e.g., Salary, Freelance, Investment)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mb-4"
              />
              <div className="mb-3">
                <label className="form-label small text-muted">
                  <i className="fas fa-credit-card me-1"></i>Payment Provider
                </label>
                <select
                  className="form-select"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  <option value="">Select provider...</option>
                  {providers.map((p) => (
                    <option key={p._id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setShowModal(false)}>
                <i className="fas fa-times me-2"></i>Cancel
              </MDBBtn>
              <MDBBtn color="success" onClick={handleSubmit}>
                <i className="fas fa-check me-2"></i>
                {editItem ? 'Save Changes' : 'Add Income'}
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </div>
  );
}

export default IncomePage;

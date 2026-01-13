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

const COLLECTION_NAME = 'outgoing';

function OutgoingPage({ onDataChange, providers, currency }) {
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
  const [recurring, setRecurring] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
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
    setRecurring(false);
    setBillingCycle('monthly');
    setNextPaymentDate('');
    setIconPath('');
    setIconPreview(null);
    setEditItem(null);
  };

  const calculateNextPaymentDate = (cycle, startDate) => {
    const date = new Date(startDate || new Date());
    switch (cycle) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const handleRecurringChange = (checked) => {
    setRecurring(checked);
    if (checked && !nextPaymentDate) {
      setNextPaymentDate(calculateNextPaymentDate(billingCycle, date));
    }
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
    if (recurring) {
      setNextPaymentDate(calculateNextPaymentDate(cycle, date));
    }
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
    setRecurring(item.recurring || false);
    setBillingCycle(item.billingCycle || 'monthly');
    setNextPaymentDate(item.nextPaymentDate || '');
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
    const result = await window.electronAPI.image.upload('outgoing');
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
      recurring: recurring ? 1 : 0,
      billingCycle: recurring ? billingCycle : null,
      nextPaymentDate: recurring ? nextPaymentDate : null,
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

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    const diffTime = date - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleExportCSV = async () => {
    if (items.length === 0) return;

    const headers = ['Date', 'Description', 'Category', 'Provider', 'Recurring', 'Amount'];
    const rows = items.map(item => [
      item.date || '',
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.provider || '').replace(/"/g, '""')}"`,
      item.recurring ? 'Yes' : 'No',
      item.amount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const today = new Date().toISOString().split('T')[0];
    await window.electronAPI.export.csv(csvContent, `expenses_export_${today}.csv`);
  };

  const formatCurrency = (amount) => {
    if (currency === 'EUR') {
      return (amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
    }
    return '$' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const totalOutgoing = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const recurringTotal = items.filter(i => i.recurring).reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0 fw-bold">
          <i className="fas fa-arrow-up me-2 text-danger"></i>
          Outgoing / Expenses
        </h4>
        <div>
          <MDBBtn color="secondary" className="me-2" onClick={handleExportCSV} disabled={items.length === 0}>
            <i className="fas fa-file-csv me-2"></i>
            Export CSV
          </MDBBtn>
          <MDBBtn color="danger" onClick={openAddModal}>
            <i className="fas fa-plus me-2"></i>
            Add Expense
          </MDBBtn>
        </div>
      </div>

      {/* Summary Cards */}
      <MDBRow className="mb-4">
        <MDBCol md="6">
          <MDBCard className="border-0 shadow-sm bg-danger bg-opacity-10">
            <MDBCardBody>
              <small className="text-muted">
                <i className="fas fa-receipt me-1"></i> Total Expenses
              </small>
              <h3 className="text-danger fw-bold mb-0">{formatCurrency(totalOutgoing)}</h3>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
        <MDBCol md="6">
          <MDBCard className="border-0 shadow-sm bg-warning bg-opacity-10">
            <MDBCardBody>
              <small className="text-muted">
                <i className="fas fa-sync me-1"></i> Recurring Monthly
              </small>
              <h3 className="text-warning fw-bold mb-0">{formatCurrency(recurringTotal)}</h3>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>

      {/* Expenses Table */}
      <MDBCard className="border-0 shadow-sm">
        <MDBCardBody>
          {loading ? (
            <div className="text-center py-4">
              <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="fas fa-inbox fa-3x mb-3"></i>
              <p>No expense entries yet. Click "Add Expense" to get started.</p>
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
                  <th className="text-center">Recurring</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </MDBTableHead>
              <MDBTableBody>
                {items.map((item) => {
                  const itemId = item.id || item._id;
                  const daysUntil = item.recurring ? getDaysUntil(item.nextPaymentDate) : null;
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
                          <div className="rounded bg-danger bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                            <i className="fas fa-receipt text-danger"></i>
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
                      <td className="text-center">
                        {item.recurring ? (
                          <div>
                            <MDBBadge color="warning" className="me-1">
                              <i className="fas fa-sync me-1"></i>
                              {item.billingCycle || 'Monthly'}
                            </MDBBadge>
                            {daysUntil !== null && (
                              <MDBBadge color={daysUntil <= 3 ? 'danger' : daysUntil <= 7 ? 'warning' : 'info'}>
                                {daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                              </MDBBadge>
                            )}
                          </div>
                        ) : null}
                      </td>
                      <td className="text-end text-danger fw-bold">
                        -{formatCurrency(item.amount)}
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
            <MDBModalHeader className="bg-danger text-white">
              <MDBModalTitle>
                <i className={`fas fa-${editItem ? 'edit' : 'plus'} me-2`}></i>
                {editItem ? 'Edit Expense' : 'Add Expense'}
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
                    background: iconPreview ? 'transparent' : 'rgba(220, 53, 69, 0.1)',
                    cursor: 'pointer',
                    border: '2px dashed #dc3545'
                  }}
                  onClick={handleUploadIcon}
                >
                  {iconPreview ? (
                    <img src={iconPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-camera text-danger fa-2x"></i>
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
                label="Category (e.g., Bills, Subscription, Food)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mb-4"
              />
              <div className="mb-4">
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
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="recurringCheck"
                  checked={recurring}
                  onChange={(e) => handleRecurringChange(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="recurringCheck">
                  <i className="fas fa-sync me-2"></i>
                  This is a recurring subscription
                </label>
              </div>

              {recurring && (
                <div className="bg-light rounded p-3">
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      <i className="fas fa-calendar-alt me-1"></i>Billing Cycle
                    </label>
                    <select
                      className="form-select"
                      value={billingCycle}
                      onChange={(e) => handleBillingCycleChange(e.target.value)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label small text-muted">
                      <i className="fas fa-clock me-1"></i>Next Payment Date
                    </label>
                    <MDBInput
                      type="date"
                      value={nextPaymentDate}
                      onChange={(e) => setNextPaymentDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setShowModal(false)}>
                <i className="fas fa-times me-2"></i>Cancel
              </MDBBtn>
              <MDBBtn color="danger" onClick={handleSubmit}>
                <i className="fas fa-check me-2"></i>
                {editItem ? 'Save Changes' : 'Add Expense'}
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </div>
  );
}

export default OutgoingPage;

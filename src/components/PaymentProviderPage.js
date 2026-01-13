import React, { useState, useEffect } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBInput,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBRow,
  MDBCol,
  MDBBadge
} from 'mdb-react-ui-kit';

const COLLECTION_NAME = 'payment_providers';

function PaymentProviderPage({ onDataChange }) {
  const [items, setItems] = useState([]);
  const [itemImages, setItemImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [iconPath, setIconPath] = useState('');
  const [iconPreview, setIconPreview] = useState(null);

  const providerTypes = [
    { value: 'bank', label: 'Bank Account', icon: 'fas fa-university', color: 'primary' },
    { value: 'credit_card', label: 'Credit Card', icon: 'fas fa-credit-card', color: 'warning' },
    { value: 'paypal', label: 'PayPal', icon: 'fab fa-paypal', color: 'info' },
    { value: 'crypto', label: 'Cryptocurrency', icon: 'fab fa-bitcoin', color: 'warning' },
    { value: 'cash', label: 'Cash', icon: 'fas fa-money-bill-wave', color: 'success' },
    { value: 'other', label: 'Other', icon: 'fas fa-wallet', color: 'secondary' }
  ];

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
    setName('');
    setType('bank');
    setAccountNumber('');
    setNotes('');
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
    setName(item.name || '');
    setType(item.type || 'bank');
    setAccountNumber(item.accountNumber || '');
    setNotes(item.notes || '');
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
    const result = await window.electronAPI.image.upload('provider');
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
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      type,
      accountNumber: accountNumber.trim(),
      notes: notes.trim(),
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

  const getTypeInfo = (typeValue) => {
    return providerTypes.find(t => t.value === typeValue) || providerTypes[5];
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0 fw-bold">
          <i className="fas fa-credit-card me-2 text-primary"></i>
          Payment Providers
        </h4>
        <MDBBtn color="primary" onClick={openAddModal}>
          <i className="fas fa-plus me-2"></i>
          Add Provider
        </MDBBtn>
      </div>

      {/* Info Card */}
      <MDBCard className="border-0 shadow-sm mb-4 bg-info bg-opacity-10">
        <MDBCardBody>
          <i className="fas fa-info-circle me-2 text-info"></i>
          Payment providers help you track where your money comes from and goes to.
          Add your bank accounts, credit cards, PayPal, etc. You can also upload custom icons/logos.
        </MDBCardBody>
      </MDBCard>

      {/* Providers Grid */}
      {loading ? (
        <div className="text-center py-4">
          <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
        </div>
      ) : items.length === 0 ? (
        <MDBCard className="border-0 shadow-sm">
          <MDBCardBody className="text-center py-5 text-muted">
            <i className="fas fa-credit-card fa-3x mb-3"></i>
            <p>No payment providers yet. Click "Add Provider" to get started.</p>
          </MDBCardBody>
        </MDBCard>
      ) : (
        <MDBRow>
          {items.map((item) => {
            const typeInfo = getTypeInfo(item.type);
            const itemId = item.id || item._id;
            return (
              <MDBCol md="6" lg="4" key={itemId} className="mb-4">
                <MDBCard className="border-0 shadow-sm h-100">
                  <MDBCardBody>
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        {itemImages[itemId] ? (
                          <img
                            src={itemImages[itemId]}
                            alt=""
                            className="rounded me-3"
                            style={{ width: 50, height: 50, objectFit: 'cover' }}
                          />
                        ) : (
                          <div className={`rounded bg-${typeInfo.color} bg-opacity-10 p-3 me-3 d-flex align-items-center justify-content-center`}>
                            <i className={`${typeInfo.icon} text-${typeInfo.color} fa-lg`}></i>
                          </div>
                        )}
                        <div>
                          <h6 className="mb-0 fw-bold">{item.name}</h6>
                          <MDBBadge color={typeInfo.color} className="mt-1">
                            <i className={`${typeInfo.icon} me-1`}></i>
                            {typeInfo.label}
                          </MDBBadge>
                        </div>
                      </div>
                      <div>
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
                      </div>
                    </div>

                    {item.accountNumber && (
                      <p className="text-muted small mb-2">
                        <i className="fas fa-hashtag me-2"></i>
                        ****{item.accountNumber.slice(-4)}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-muted small mb-0">
                        <i className="fas fa-sticky-note me-2"></i>
                        {item.notes}
                      </p>
                    )}
                  </MDBCardBody>
                </MDBCard>
              </MDBCol>
            );
          })}
        </MDBRow>
      )}

      {/* Add/Edit Modal */}
      <MDBModal open={showModal} setOpen={setShowModal} tabIndex="-1">
        <MDBModalDialog>
          <MDBModalContent>
            <MDBModalHeader className="bg-primary text-white">
              <MDBModalTitle>
                <i className={`fas fa-${editItem ? 'edit' : 'plus'} me-2`}></i>
                {editItem ? 'Edit Provider' : 'Add Payment Provider'}
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
                    background: iconPreview ? 'transparent' : 'rgba(13, 110, 253, 0.1)',
                    cursor: 'pointer',
                    border: '2px dashed #0d6efd'
                  }}
                  onClick={handleUploadIcon}
                >
                  {iconPreview ? (
                    <img src={iconPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-camera text-primary fa-2x"></i>
                  )}
                </div>
                <div className="mt-2">
                  <MDBBtn size="sm" color="link" onClick={handleUploadIcon}>
                    <i className="fas fa-upload me-1"></i>Upload Logo
                  </MDBBtn>
                  {iconPreview && (
                    <MDBBtn size="sm" color="link" className="text-danger" onClick={handleRemoveIcon}>
                      <i className="fas fa-times me-1"></i>Remove
                    </MDBBtn>
                  )}
                </div>
              </div>

              <MDBInput
                label="Provider Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-4"
                required
              />

              <div className="mb-4">
                <label className="form-label small text-muted">
                  <i className="fas fa-tag me-1"></i>Provider Type
                </label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {providerTypes.map((pt) => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>

              <MDBInput
                label="Account Number (optional)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="mb-4"
              />

              <MDBInput
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mb-4"
              />
            </MDBModalBody>
            <MDBModalFooter>
              <MDBBtn color="secondary" onClick={() => setShowModal(false)}>
                <i className="fas fa-times me-2"></i>Cancel
              </MDBBtn>
              <MDBBtn color="primary" onClick={handleSubmit}>
                <i className="fas fa-check me-2"></i>
                {editItem ? 'Save Changes' : 'Add Provider'}
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </div>
  );
}

export default PaymentProviderPage;

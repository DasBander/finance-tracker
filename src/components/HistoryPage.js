import React, { useState, useEffect } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBBtnGroup,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBRow,
  MDBCol,
  MDBBadge
} from 'mdb-react-ui-kit';

function HistoryPage({ currency }) {
  const [viewMode, setViewMode] = useState('monthly'); // weekly, monthly, yearly
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incomeImages, setIncomeImages] = useState({});
  const [outgoingImages, setOutgoingImages] = useState({});

  useEffect(() => {
    loadHistoryData();
  }, [viewMode, currentDate]);

  const getDateRange = () => {
    const date = new Date(currentDate);

    if (viewMode === 'weekly') {
      const dayOfWeek = date.getDay();
      const start = new Date(date);
      start.setDate(date.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    } else if (viewMode === 'monthly') {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    } else {
      const start = new Date(date.getFullYear(), 0, 1);
      const end = new Date(date.getFullYear(), 11, 31);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    }
  };

  const loadHistoryData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    const result = await window.electronAPI.db.getHistory(start, end);
    if (result.success) {
      setHistoryData(result.data);
      loadImages(result.data.income, result.data.outgoing);
    }
    setLoading(false);
  };

  const loadImages = async (incomeList, outgoingList) => {
    const incomeImgs = {};
    for (const item of incomeList) {
      if (item.icon) {
        const result = await window.electronAPI.image.get(item.icon);
        if (result.success) {
          incomeImgs[item.id] = result.data;
        }
      }
    }
    setIncomeImages(incomeImgs);

    const outgoingImgs = {};
    for (const item of outgoingList) {
      if (item.icon) {
        const result = await window.electronAPI.image.get(item.icon);
        if (result.success) {
          outgoingImgs[item.id] = result.data;
        }
      }
    }
    setOutgoingImages(outgoingImgs);
  };

  const navigatePeriod = (direction) => {
    const date = new Date(currentDate);

    if (viewMode === 'weekly') {
      date.setDate(date.getDate() + (direction * 7));
    } else if (viewMode === 'monthly') {
      date.setMonth(date.getMonth() + direction);
    } else {
      date.setFullYear(date.getFullYear() + direction);
    }

    setCurrentDate(date);
  };

  const getPeriodLabel = () => {
    const date = new Date(currentDate);

    if (viewMode === 'weekly') {
      const { start, end } = getDateRange();
      return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
    } else if (viewMode === 'monthly') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return date.getFullYear().toString();
    }
  };

  const formatCurrency = (amount) => {
    if (currency === 'EUR') {
      return (amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
    }
    return '$' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0 fw-bold">
          <i className="fas fa-history me-2 text-primary"></i>
          History
        </h4>

        {/* View Mode Switcher */}
        <MDBBtnGroup>
          <MDBBtn
            color={viewMode === 'weekly' ? 'primary' : 'light'}
            onClick={() => setViewMode('weekly')}
          >
            Weekly
          </MDBBtn>
          <MDBBtn
            color={viewMode === 'monthly' ? 'primary' : 'light'}
            onClick={() => setViewMode('monthly')}
          >
            Monthly
          </MDBBtn>
          <MDBBtn
            color={viewMode === 'yearly' ? 'primary' : 'light'}
            onClick={() => setViewMode('yearly')}
          >
            Yearly
          </MDBBtn>
        </MDBBtnGroup>
      </div>

      {/* Period Navigation */}
      <MDBCard className="border-0 shadow-sm mb-4">
        <MDBCardBody className="d-flex align-items-center justify-content-between">
          <MDBBtn color="light" onClick={() => navigatePeriod(-1)}>
            <i className="fas fa-chevron-left"></i>
          </MDBBtn>
          <h5 className="mb-0 fw-bold">
            <i className="fas fa-calendar me-2 text-muted"></i>
            {getPeriodLabel()}
          </h5>
          <MDBBtn color="light" onClick={() => navigatePeriod(1)}>
            <i className="fas fa-chevron-right"></i>
          </MDBBtn>
        </MDBCardBody>
      </MDBCard>

      {loading ? (
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
        </div>
      ) : historyData ? (
        <>
          {/* Summary Cards */}
          <MDBRow className="mb-4">
            <MDBCol md="4">
              <MDBCard className="border-0 shadow-sm bg-success bg-opacity-10">
                <MDBCardBody>
                  <small className="text-muted">
                    <i className="fas fa-arrow-down me-1"></i> Total Income
                  </small>
                  <h4 className="text-success fw-bold mb-0">
                    +{formatCurrency(historyData.incomeTotal)}
                  </h4>
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
            <MDBCol md="4">
              <MDBCard className="border-0 shadow-sm bg-danger bg-opacity-10">
                <MDBCardBody>
                  <small className="text-muted">
                    <i className="fas fa-arrow-up me-1"></i> Total Expenses
                  </small>
                  <h4 className="text-danger fw-bold mb-0">
                    -{formatCurrency(historyData.outgoingTotal)}
                  </h4>
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
            <MDBCol md="4">
              <MDBCard className={`border-0 shadow-sm ${historyData.net >= 0 ? 'bg-primary' : 'bg-warning'} bg-opacity-10`}>
                <MDBCardBody>
                  <small className="text-muted">
                    <i className="fas fa-wallet me-1"></i> Net
                  </small>
                  <h4 className={`fw-bold mb-0 ${historyData.net >= 0 ? 'text-primary' : 'text-warning'}`}>
                    {historyData.net >= 0 ? '+' : ''}{formatCurrency(historyData.net)}
                  </h4>
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          </MDBRow>

          {/* Category Breakdown */}
          {historyData.categoryBreakdown.length > 0 && (
            <MDBCard className="border-0 shadow-sm mb-4">
              <MDBCardBody>
                <h6 className="fw-bold mb-3">
                  <i className="fas fa-chart-pie me-2 text-danger"></i>
                  Expense Categories
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {historyData.categoryBreakdown.map((cat, idx) => (
                    <MDBBadge
                      key={idx}
                      color="light"
                      className="text-dark p-2"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <i className="fas fa-tag me-1 text-muted"></i>
                      {cat.category || 'Uncategorized'}: {formatCurrency(cat.total)}
                    </MDBBadge>
                  ))}
                </div>
              </MDBCardBody>
            </MDBCard>
          )}

          {/* Transactions */}
          <MDBRow>
            {/* Income */}
            <MDBCol md="6">
              <MDBCard className="border-0 shadow-sm h-100">
                <MDBCardBody>
                  <h6 className="fw-bold mb-3">
                    <i className="fas fa-arrow-down me-2 text-success"></i>
                    Income ({historyData.income.length})
                  </h6>
                  {historyData.income.length === 0 ? (
                    <p className="text-muted text-center">No income in this period</p>
                  ) : (
                    <MDBTable small hover className="mb-0">
                      <MDBTableHead light>
                        <tr>
                          <th></th>
                          <th>Description</th>
                          <th>Date</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </MDBTableHead>
                      <MDBTableBody>
                        {historyData.income.map((item) => (
                          <tr key={item.id}>
                            <td style={{ width: 36 }}>
                              {incomeImages[item.id] ? (
                                <img
                                  src={incomeImages[item.id]}
                                  alt=""
                                  className="rounded"
                                  style={{ width: 28, height: 28, objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="rounded bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                                  <i className="fas fa-coins text-success" style={{ fontSize: 12 }}></i>
                                </div>
                              )}
                            </td>
                            <td>{item.description}</td>
                            <td>{formatDate(item.date)}</td>
                            <td className="text-end text-success fw-bold">
                              +{formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </MDBTableBody>
                    </MDBTable>
                  )}
                </MDBCardBody>
              </MDBCard>
            </MDBCol>

            {/* Expenses */}
            <MDBCol md="6">
              <MDBCard className="border-0 shadow-sm h-100">
                <MDBCardBody>
                  <h6 className="fw-bold mb-3">
                    <i className="fas fa-arrow-up me-2 text-danger"></i>
                    Expenses ({historyData.outgoing.length})
                  </h6>
                  {historyData.outgoing.length === 0 ? (
                    <p className="text-muted text-center">No expenses in this period</p>
                  ) : (
                    <MDBTable small hover className="mb-0">
                      <MDBTableHead light>
                        <tr>
                          <th></th>
                          <th>Description</th>
                          <th>Date</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </MDBTableHead>
                      <MDBTableBody>
                        {historyData.outgoing.map((item) => (
                          <tr key={item.id}>
                            <td style={{ width: 36 }}>
                              {outgoingImages[item.id] ? (
                                <img
                                  src={outgoingImages[item.id]}
                                  alt=""
                                  className="rounded"
                                  style={{ width: 28, height: 28, objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="rounded bg-danger bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                                  <i className="fas fa-receipt text-danger" style={{ fontSize: 12 }}></i>
                                </div>
                              )}
                            </td>
                            <td>
                              {item.description}
                              {item.recurring === 1 && (
                                <MDBBadge color="warning" className="ms-1" style={{ fontSize: '0.6rem' }}>
                                  <i className="fas fa-sync"></i>
                                </MDBBadge>
                              )}
                            </td>
                            <td>{formatDate(item.date)}</td>
                            <td className="text-end text-danger fw-bold">
                              -{formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </MDBTableBody>
                    </MDBTable>
                  )}
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          </MDBRow>
        </>
      ) : (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-calendar-times fa-3x mb-3"></i>
          <p>No data available for this period</p>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;

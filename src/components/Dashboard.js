import React, { useState, useEffect } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBRow,
  MDBCol,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBProgress,
  MDBProgressBar
} from 'mdb-react-ui-kit';

function Dashboard({ stats, currency }) {
  const [incomeImages, setIncomeImages] = useState({});
  const [outgoingImages, setOutgoingImages] = useState({});

  useEffect(() => {
    loadImages();
  }, [stats.recentIncome, stats.recentOutgoing]);

  const loadImages = async () => {
    // Load income images
    const incomeImgs = {};
    for (const item of stats.recentIncome) {
      if (item.icon) {
        const result = await window.electronAPI.image.get(item.icon);
        if (result.success) {
          incomeImgs[item.id || item._id] = result.data;
        }
      }
    }
    setIncomeImages(incomeImgs);

    // Load outgoing images
    const outgoingImgs = {};
    for (const item of stats.recentOutgoing) {
      if (item.icon) {
        const result = await window.electronAPI.image.get(item.icon);
        if (result.success) {
          outgoingImgs[item.id || item._id] = result.data;
        }
      }
    }
    setOutgoingImages(outgoingImgs);
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

  const getMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const maxMonthly = Math.max(
    ...stats.monthlyIncome.map(m => m.total),
    ...stats.monthlyOutgoing.map(m => m.total),
    1
  );

  return (
    <div className="p-4">
      <h4 className="mb-4 fw-bold">
        <i className="fas fa-tachometer-alt me-2 text-primary"></i>
        Dashboard
      </h4>

      {/* Stats Cards */}
      <MDBRow className="mb-4">
        <MDBCol md="4">
          <MDBCard className="border-0 shadow-sm">
            <MDBCardBody>
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                  <i className="fas fa-arrow-down text-success fa-2x"></i>
                </div>
                <div className="ms-3">
                  <small className="text-muted">Total Income</small>
                  <h4 className="mb-0 text-success fw-bold">{formatCurrency(stats.totalIncome)}</h4>
                </div>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>

        <MDBCol md="4">
          <MDBCard className="border-0 shadow-sm">
            <MDBCardBody>
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-danger bg-opacity-10 p-3">
                  <i className="fas fa-arrow-up text-danger fa-2x"></i>
                </div>
                <div className="ms-3">
                  <small className="text-muted">Total Outgoing</small>
                  <h4 className="mb-0 text-danger fw-bold">{formatCurrency(stats.totalOutgoing)}</h4>
                </div>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>

        <MDBCol md="4">
          <MDBCard className="border-0 shadow-sm">
            <MDBCardBody>
              <div className="d-flex align-items-center">
                <div className={`rounded-circle ${stats.balance >= 0 ? 'bg-primary' : 'bg-warning'} bg-opacity-10 p-3`}>
                  <i className={`fas fa-wallet ${stats.balance >= 0 ? 'text-primary' : 'text-warning'} fa-2x`}></i>
                </div>
                <div className="ms-3">
                  <small className="text-muted">Balance</small>
                  <h4 className={`mb-0 fw-bold ${stats.balance >= 0 ? 'text-primary' : 'text-warning'}`}>
                    {formatCurrency(stats.balance)}
                  </h4>
                </div>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>

      {/* Monthly Overview */}
      <MDBRow className="mb-4">
        <MDBCol md="6">
          <MDBCard className="border-0 shadow-sm h-100">
            <MDBCardBody>
              <h6 className="fw-bold mb-3">
                <i className="fas fa-chart-bar me-2 text-success"></i>
                Monthly Income
              </h6>
              {stats.monthlyIncome.length === 0 ? (
                <p className="text-muted">No income data yet</p>
              ) : (
                stats.monthlyIncome.map((month) => (
                  <div key={month._id} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>{getMonthName(month._id)}</small>
                      <small className="text-success">{formatCurrency(month.total)}</small>
                    </div>
                    <MDBProgress height="8">
                      <MDBProgressBar
                        bgColor="success"
                        width={(month.total / maxMonthly) * 100}
                      />
                    </MDBProgress>
                  </div>
                ))
              )}
            </MDBCardBody>
          </MDBCard>
        </MDBCol>

        <MDBCol md="6">
          <MDBCard className="border-0 shadow-sm h-100">
            <MDBCardBody>
              <h6 className="fw-bold mb-3">
                <i className="fas fa-chart-bar me-2 text-danger"></i>
                Monthly Expenses
              </h6>
              {stats.monthlyOutgoing.length === 0 ? (
                <p className="text-muted">No expense data yet</p>
              ) : (
                stats.monthlyOutgoing.map((month) => (
                  <div key={month._id} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>{getMonthName(month._id)}</small>
                      <small className="text-danger">{formatCurrency(month.total)}</small>
                    </div>
                    <MDBProgress height="8">
                      <MDBProgressBar
                        bgColor="danger"
                        width={(month.total / maxMonthly) * 100}
                      />
                    </MDBProgress>
                  </div>
                ))
              )}
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>

      {/* Recent Transactions */}
      <MDBRow>
        <MDBCol md="6">
          <MDBCard className="border-0 shadow-sm">
            <MDBCardBody>
              <h6 className="fw-bold mb-3">
                <i className="fas fa-arrow-down me-2 text-success"></i>
                Recent Income
              </h6>
              {stats.recentIncome.length === 0 ? (
                <p className="text-muted">No income entries yet</p>
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
                    {stats.recentIncome.map((item) => {
                      const itemId = item.id || item._id;
                      return (
                        <tr key={itemId}>
                          <td style={{ width: 40 }}>
                            {incomeImages[itemId] ? (
                              <img
                                src={incomeImages[itemId]}
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
                      );
                    })}
                  </MDBTableBody>
                </MDBTable>
              )}
            </MDBCardBody>
          </MDBCard>
        </MDBCol>

        <MDBCol md="6">
          <MDBCard className="border-0 shadow-sm">
            <MDBCardBody>
              <h6 className="fw-bold mb-3">
                <i className="fas fa-arrow-up me-2 text-danger"></i>
                Recent Expenses
              </h6>
              {stats.recentOutgoing.length === 0 ? (
                <p className="text-muted">No expense entries yet</p>
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
                    {stats.recentOutgoing.map((item) => {
                      const itemId = item.id || item._id;
                      return (
                        <tr key={itemId}>
                          <td style={{ width: 40 }}>
                            {outgoingImages[itemId] ? (
                              <img
                                src={outgoingImages[itemId]}
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
                          <td>{item.description}</td>
                          <td>{formatDate(item.date)}</td>
                          <td className="text-end text-danger fw-bold">
                            -{formatCurrency(item.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </MDBTableBody>
                </MDBTable>
              )}
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </div>
  );
}

export default Dashboard;

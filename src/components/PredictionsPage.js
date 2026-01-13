import React, { useState, useEffect } from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBRow,
  MDBCol,
  MDBBadge,
  MDBProgress,
  MDBProgressBar,
  MDBTable,
  MDBTableHead,
  MDBTableBody
} from 'mdb-react-ui-kit';

function PredictionsPage({ currency, stats }) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionImages, setSubscriptionImages] = useState({});

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    const result = await window.electronAPI.db.getPredictions();
    if (result.success) {
      setPredictions(result.data);
      loadSubscriptionImages(result.data.subscriptions);
    }
    setLoading(false);
  };

  const loadSubscriptionImages = async (subscriptions) => {
    const imgs = {};
    for (const sub of subscriptions) {
      if (sub.icon) {
        const result = await window.electronAPI.image.get(sub.icon);
        if (result.success) {
          imgs[sub.id] = result.data;
        }
      }
    }
    setSubscriptionImages(imgs);
  };

  const formatCurrency = (amount) => {
    if (currency === 'EUR') {
      return (amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
    }
    return '$' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilLabel = (dateStr) => {
    const days = getDaysUntil(dateStr);
    if (days === null) return 'No date set';
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days <= 7) return `Due in ${days} days`;
    return `Due in ${days} days`;
  };

  const getDaysUntilColor = (dateStr) => {
    const days = getDaysUntil(dateStr);
    if (days === null) return 'secondary';
    if (days < 0) return 'danger';
    if (days <= 3) return 'warning';
    if (days <= 7) return 'info';
    return 'secondary';
  };

  const getCategoryTrend = (category) => {
    if (!predictions) return { trend: 0, direction: 'neutral' };

    const recent = predictions.recentCategories.find(c => c.category === category);
    const previous = predictions.previousCategories.find(c => c.category === category);

    if (!recent || !previous || previous.total === 0) return { trend: 0, direction: 'neutral' };

    const change = ((recent.total - previous.total) / previous.total) * 100;

    return {
      trend: Math.abs(change).toFixed(1),
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral'
    };
  };

  const calculateProjections = () => {
    if (!predictions) return { week: 0, month: 0, threeMonths: 0 };

    const weeklyIncome = predictions.avgMonthlyIncome / 4;
    const weeklyExpense = predictions.avgMonthlyOutgoing / 4;
    const weeklySubscriptions = predictions.subscriptionMonthlyTotal / 4;

    const weeklyNet = weeklyIncome - weeklyExpense - weeklySubscriptions;
    const monthlyNet = predictions.avgMonthlyIncome - predictions.avgMonthlyOutgoing - predictions.subscriptionMonthlyTotal;

    return {
      week: predictions.currentBalance + weeklyNet,
      month: predictions.currentBalance + monthlyNet,
      threeMonths: predictions.currentBalance + (monthlyNet * 3)
    };
  };

  const projections = calculateProjections();

  const getSavingsRate = () => {
    if (!predictions || predictions.avgMonthlyIncome === 0) return 0;
    const savings = predictions.avgMonthlyIncome - predictions.avgMonthlyOutgoing;
    return ((savings / predictions.avgMonthlyIncome) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="p-4 text-center text-muted">
        <i className="fas fa-chart-line fa-3x mb-3"></i>
        <p>Unable to load prediction data</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h4 className="mb-4 fw-bold">
        <i className="fas fa-chart-line me-2 text-primary"></i>
        Predictions & Trends
      </h4>

      {/* Balance Projections */}
      <MDBCard className="border-0 shadow-sm mb-4">
        <MDBCardBody>
          <h6 className="fw-bold mb-3">
            <i className="fas fa-crystal-ball me-2 text-primary"></i>
            Balance Projections
          </h6>
          <MDBRow>
            <MDBCol md="3">
              <div className="text-center p-3 bg-light rounded">
                <small className="text-muted d-block">Current Balance</small>
                <h4 className={`fw-bold mb-0 ${predictions.currentBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
                  {formatCurrency(predictions.currentBalance)}
                </h4>
              </div>
            </MDBCol>
            <MDBCol md="3">
              <div className="text-center p-3 bg-light rounded">
                <small className="text-muted d-block">In 1 Week</small>
                <h4 className={`fw-bold mb-0 ${projections.week >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(projections.week)}
                </h4>
              </div>
            </MDBCol>
            <MDBCol md="3">
              <div className="text-center p-3 bg-light rounded">
                <small className="text-muted d-block">In 1 Month</small>
                <h4 className={`fw-bold mb-0 ${projections.month >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(projections.month)}
                </h4>
              </div>
            </MDBCol>
            <MDBCol md="3">
              <div className="text-center p-3 bg-light rounded">
                <small className="text-muted d-block">In 3 Months</small>
                <h4 className={`fw-bold mb-0 ${projections.threeMonths >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(projections.threeMonths)}
                </h4>
              </div>
            </MDBCol>
          </MDBRow>
        </MDBCardBody>
      </MDBCard>

      <MDBRow className="mb-4">
        {/* Monthly Averages */}
        <MDBCol md="6">
          <MDBCard className="border-0 shadow-sm h-100">
            <MDBCardBody>
              <h6 className="fw-bold mb-3">
                <i className="fas fa-calculator me-2 text-info"></i>
                Monthly Averages
              </h6>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Average Income</span>
                  <span className="text-success fw-bold">{formatCurrency(predictions.avgMonthlyIncome)}</span>
                </div>
                <MDBProgress height="10">
                  <MDBProgressBar bgColor="success" width={100} />
                </MDBProgress>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Average Expenses</span>
                  <span className="text-danger fw-bold">{formatCurrency(predictions.avgMonthlyOutgoing)}</span>
                </div>
                <MDBProgress height="10">
                  <MDBProgressBar
                    bgColor="danger"
                    width={predictions.avgMonthlyIncome > 0 ? (predictions.avgMonthlyOutgoing / predictions.avgMonthlyIncome) * 100 : 0}
                  />
                </MDBProgress>
              </div>
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Subscriptions</span>
                  <span className="text-warning fw-bold">{formatCurrency(predictions.subscriptionMonthlyTotal)}</span>
                </div>
                <MDBProgress height="10">
                  <MDBProgressBar
                    bgColor="warning"
                    width={predictions.avgMonthlyIncome > 0 ? (predictions.subscriptionMonthlyTotal / predictions.avgMonthlyIncome) * 100 : 0}
                  />
                </MDBProgress>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>

        {/* Savings Rate */}
        <MDBCol md="6">
          <MDBCard className="border-0 shadow-sm h-100">
            <MDBCardBody>
              <h6 className="fw-bold mb-3">
                <i className="fas fa-piggy-bank me-2 text-success"></i>
                Savings Analysis
              </h6>
              <div className="text-center py-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-2"
                  style={{
                    width: 120,
                    height: 120,
                    background: `conic-gradient(${parseFloat(getSavingsRate()) >= 0 ? '#28a745' : '#dc3545'} ${Math.abs(parseFloat(getSavingsRate())) * 3.6}deg, #e9ecef 0deg)`
                  }}
                >
                  <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 100, height: 100 }}>
                    <div>
                      <h3 className={`mb-0 fw-bold ${parseFloat(getSavingsRate()) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {getSavingsRate()}%
                      </h3>
                      <small className="text-muted">Savings Rate</small>
                    </div>
                  </div>
                </div>
                <p className="text-muted small mt-2 mb-0">
                  {parseFloat(getSavingsRate()) >= 20
                    ? 'Great savings rate!'
                    : parseFloat(getSavingsRate()) >= 10
                      ? 'Good progress, keep it up!'
                      : parseFloat(getSavingsRate()) >= 0
                        ? 'Try to save more if possible'
                        : 'Spending exceeds income'}
                </p>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>

      {/* Category Trends */}
      {predictions.recentCategories.length > 0 && (
        <MDBCard className="border-0 shadow-sm mb-4">
          <MDBCardBody>
            <h6 className="fw-bold mb-3">
              <i className="fas fa-chart-bar me-2 text-danger"></i>
              Spending by Category (Last 3 Months)
            </h6>
            <MDBRow>
              {predictions.recentCategories.map((cat, idx) => {
                const trend = getCategoryTrend(cat.category);
                return (
                  <MDBCol md="4" key={idx} className="mb-3">
                    <div className="p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold">{cat.category || 'Uncategorized'}</span>
                        {trend.direction !== 'neutral' && (
                          <MDBBadge color={trend.direction === 'up' ? 'danger' : 'success'}>
                            <i className={`fas fa-arrow-${trend.direction} me-1`}></i>
                            {trend.trend}%
                          </MDBBadge>
                        )}
                      </div>
                      <h5 className="text-danger mb-0">{formatCurrency(cat.total)}</h5>
                    </div>
                  </MDBCol>
                );
              })}
            </MDBRow>
          </MDBCardBody>
        </MDBCard>
      )}

      {/* Upcoming Subscriptions */}
      <MDBCard className="border-0 shadow-sm">
        <MDBCardBody>
          <h6 className="fw-bold mb-3">
            <i className="fas fa-calendar-alt me-2 text-warning"></i>
            Upcoming Subscription Payments
          </h6>
          {predictions.subscriptions.length === 0 ? (
            <p className="text-muted text-center">No active subscriptions</p>
          ) : (
            <MDBTable hover className="mb-0">
              <MDBTableHead light>
                <tr>
                  <th></th>
                  <th>Subscription</th>
                  <th>Cycle</th>
                  <th>Next Payment</th>
                  <th className="text-end">Amount</th>
                </tr>
              </MDBTableHead>
              <MDBTableBody>
                {predictions.subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ width: 40 }}>
                      {subscriptionImages[sub.id] ? (
                        <img
                          src={subscriptionImages[sub.id]}
                          alt=""
                          className="rounded"
                          style={{ width: 32, height: 32, objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="rounded bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                          <i className="fas fa-sync text-warning"></i>
                        </div>
                      )}
                    </td>
                    <td className="fw-bold">{sub.description}</td>
                    <td>
                      <MDBBadge color="light" className="text-dark">
                        {sub.billingCycle || 'Monthly'}
                      </MDBBadge>
                    </td>
                    <td>
                      <MDBBadge color={getDaysUntilColor(sub.nextPaymentDate)}>
                        {getDaysUntilLabel(sub.nextPaymentDate)}
                      </MDBBadge>
                    </td>
                    <td className="text-end text-danger fw-bold">
                      -{formatCurrency(sub.amount)}
                    </td>
                  </tr>
                ))}
              </MDBTableBody>
            </MDBTable>
          )}
        </MDBCardBody>
      </MDBCard>
    </div>
  );
}

export default PredictionsPage;

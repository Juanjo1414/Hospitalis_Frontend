import '../styles/dashboard.css';

export const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">+</span>
          <div>
            <div className="brand-name">Hospitalis</div>
            <div className="brand-sub">Medical System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a className="active"><span className="nav-dot" />Dashboard</a>
          <a><span className="nav-dot" />Appointments</a>
          <a><span className="nav-dot" />Patients</a>
          <a><span className="nav-dot" />Lab Results</a>
          <a><span className="nav-dot" />Prescriptions</a>
          <a><span className="nav-dot" />Settings</a>
          <a><span className="nav-dot" />Help &amp; Support</a>
        </nav>

        <div className="sidebar-footer">
          <span className="avatar sm" />
          <div>
            <div className="name">Dr. Sarah Jenkins</div>
            <div className="role">Cardiologist</div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <h1>Dashboard</h1>
            <div className="search">
              <span className="search-icon">🔍</span>
              <input placeholder="Search patients, records..." />
            </div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" aria-label="notifications">🔔</button>
            <div className="date">Monday, February 2, 2026</div>
          </div>
        </div>

        <div className="welcome">
          <h2>Welcome back, Dr. Sarah Jenkins</h2>
          <p>Here is your daily activity summary.</p>
        </div>

        <div className="stats-grid">
          <div className="stat">
            <div className="stat-icon blue">📅</div>
            <div>
              <div className="stat-label">Appointments</div>
              <div className="stat-value">12</div>
            </div>
            <span className="stat-badge green">+2 today</span>
          </div>
          <div className="stat">
            <div className="stat-icon orange">🧾</div>
            <div>
              <div className="stat-label">Pending Reports</div>
              <div className="stat-value">4</div>
            </div>
            <span className="stat-badge gray">Pending</span>
          </div>
          <div className="stat">
            <div className="stat-icon purple">👤</div>
            <div>
              <div className="stat-label">New Patients</div>
              <div className="stat-value">18</div>
            </div>
            <span className="stat-badge green">+5 this week</span>
          </div>
          <div className="stat">
            <div className="stat-icon red">🚨</div>
            <div>
              <div className="stat-label">Emergency Alerts</div>
              <div className="stat-value">2</div>
            </div>
            <span className="stat-badge red">Urgent</span>
          </div>
        </div>

        <div className="grid-main">
          <div className="card appointments">
            <div className="card-header">
              <h3>Today's Appointments</h3>
              <a className="link">View Calendar</a>
            </div>
            <div className="table">
              <div className="table-head">
                <span>Time</span>
                <span>Patient</span>
                <span>Type</span>
                <span>Status</span>
              </div>
              <div className="table-row">
                <span>09:00 AM</span>
                <span className="cell">
                  <span className="avatar" /> Michael Scott
                </span>
                <span>General Checkup</span>
                <span className="status green">Confirmed</span>
              </div>
              <div className="table-row">
                <span>09:45 AM</span>
                <span className="cell">
                  <span className="avatar" /> Julia Parker
                </span>
                <span>Cardiac Review</span>
                <span className="status green">Confirmed</span>
              </div>
              <div className="table-row">
                <span>10:30 AM</span>
                <span className="cell">
                  <span className="avatar" /> Robert Brown
                </span>
                <span>Follow Up</span>
                <span className="status yellow">Checking In</span>
              </div>
              <div className="table-row">
                <span>11:00 AM</span>
                <span className="cell">
                  <span className="avatar" /> Alice Lee
                </span>
                <span>Consultation</span>
                <span className="status gray">Pending</span>
              </div>
            </div>
          </div>

          <aside className="right-col">
            <div className="card upnext">
              <div className="card-header">
                <h4>Up Next</h4>
                <span className="time-pill">10:30 AM</span>
              </div>
              <div className="upnext-body">
                <span className="avatar lg" />
                <div>
                  <div className="name">Robert Brown</div>
                  <div className="muted">Follow up - 15 min</div>
                </div>
              </div>
              <button className="primary">Start Visit</button>
            </div>

            <div className="card">
              <h4>Quick Actions</h4>
              <div className="quick-actions">
                <button><span>➕</span> Add Patient</button>
                <button><span>✉️</span> New Rx</button>
                <button><span>🧪</span> Lab Order</button>
                <button><span>📝</span> Memo</button>
              </div>
            </div>

            <div className="card">
              <h4>Recent Patients</h4>
              <div className="recent">
                <div className="recent-row"><span className="avatar sm" /> Emma Klein</div>
                <div className="recent-row"><span className="avatar sm" /> James Miller</div>
                <div className="recent-row"><span className="avatar sm" /> Olivia Stone</div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

import { useState, useEffect } from "react";
import { Plus, Building2, Calendar, MapPin, ExternalLink } from "lucide-react";
import "./Companies.css";

interface Company {
  id: string;
  name: string;
  position: string;
  status: "applied" | "interview" | "offer" | "rejected" | "withdrawn";
  dateApplied: string;
  location: string;
  website?: string;
  notes?: string;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: "1",
      name: "Google",
      position: "Software Engineer",
      status: "interview",
      dateApplied: "2024-01-15",
      location: "Mountain View, CA",
      website: "https://google.com",
      notes: "Referred by John Doe",
    },
    {
      id: "2",
      name: "Meta",
      position: "Frontend Engineer",
      status: "applied",
      dateApplied: "2024-01-20",
      location: "Menlo Park, CA",
      website: "https://meta.com",
      notes: "Applied through careers page",
    },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);

  const getStatusColor = (status: Company["status"]) => {
    switch (status) {
      case "applied":
        return "status-applied";
      case "interview":
        return "status-interview";
      case "offer":
        return "status-offer";
      case "rejected":
        return "status-rejected";
      case "withdrawn":
        return "status-withdrawn";
      default:
        return "status-applied";
    }
  };

  return (
    <div className="companies-container">
      <div className="companies-header">
        <div>
          <h2>Companies</h2>
          <p>Track your job applications and their status</p>
        </div>
        <button
          className="add-company-btn"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={20} />
          Add Company
        </button>
      </div>

      <div className="companies-table-container">
        <table className="companies-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Position</th>
              <th>Status</th>
              <th>Date Applied</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>
                  <div className="company-cell">
                    <Building2 size={16} />
                    <span>{company.name}</span>
                  </div>
                </td>
                <td>{company.position}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusColor(company.status)}`}
                  >
                    {company.status.charAt(0).toUpperCase() +
                      company.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="date-cell">
                    <Calendar size={14} />
                    {new Date(company.dateApplied).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <div className="location-cell">
                    <MapPin size={14} />
                    {company.location}
                  </div>
                </td>
                <td>
                  <div className="actions-cell">
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-link"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {companies.length === 0 && (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>No companies yet</h3>
          <p>Start tracking your job applications by adding a company</p>
          <button
            className="add-company-btn"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={20} />
            Add Your First Company
          </button>
        </div>
      )}
    </div>
  );
}

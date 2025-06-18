import { useState, useEffect } from "react";
import {
  Plus,
  User,
  Mail,
  Phone,
  Building2,
  MessageCircle,
} from "lucide-react";
import "./Contacts.css";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company: string;
  position: string;
  relationship: "recruiter" | "employee" | "manager" | "referral" | "other";
  lastContact: string;
  notes?: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "1",
      name: "Jane Smith",
      email: "jane.smith@google.com",
      phone: "+1 (555) 123-4567",
      company: "Google",
      position: "Senior Software Engineer",
      relationship: "employee",
      lastContact: "2024-01-20",
      notes: "Met at tech conference",
    },
    {
      id: "2",
      name: "Mike Johnson",
      email: "mike.j@meta.com",
      company: "Meta",
      position: "Engineering Manager",
      relationship: "manager",
      lastContact: "2024-01-18",
      notes: "LinkedIn connection, very helpful",
    },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);

  const getRelationshipColor = (relationship: Contact["relationship"]) => {
    switch (relationship) {
      case "recruiter":
        return "relationship-recruiter";
      case "employee":
        return "relationship-employee";
      case "manager":
        return "relationship-manager";
      case "referral":
        return "relationship-referral";
      case "other":
        return "relationship-other";
      default:
        return "relationship-other";
    }
  };

  return (
    <div className="contacts-container">
      <div className="contacts-header">
        <div>
          <h2>Contacts</h2>
          <p>Manage your professional networking contacts</p>
        </div>
        <button
          className="add-contact-btn"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={20} />
          Add Contact
        </button>
      </div>

      <div className="contacts-table-container">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company & Position</th>
              <th>Relationship</th>
              <th>Contact Info</th>
              <th>Last Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>
                  <div className="contact-cell">
                    <User size={16} />
                    <span>{contact.name}</span>
                  </div>
                </td>
                <td>
                  <div className="company-position-cell">
                    <div className="company">
                      <Building2 size={14} />
                      {contact.company}
                    </div>
                    <div className="position">{contact.position}</div>
                  </div>
                </td>
                <td>
                  <span
                    className={`relationship-badge ${getRelationshipColor(
                      contact.relationship
                    )}`}
                  >
                    {contact.relationship.charAt(0).toUpperCase() +
                      contact.relationship.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="contact-info-cell">
                    {contact.email && (
                      <div className="contact-item">
                        <Mail size={14} />
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="contact-item">
                        <Phone size={14} />
                        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                      </div>
                    )}
                  </div>
                </td>
                <td>{new Date(contact.lastContact).toLocaleDateString()}</td>
                <td>
                  <div className="actions-cell">
                    <button className="action-btn" title="Send message">
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contacts.length === 0 && (
        <div className="empty-state">
          <User size={48} />
          <h3>No contacts yet</h3>
          <p>Start building your professional network by adding contacts</p>
          <button
            className="add-contact-btn"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={20} />
            Add Your First Contact
          </button>
        </div>
      )}
    </div>
  );
}

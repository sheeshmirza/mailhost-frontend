"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  AudienceView,
  ContactView,
  SegmentView,
  TopicView,
} from "@/lib/api";
import {
  Users,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  FolderPlus,
  Filter,
  Tag,
  X,
  Check,
  ChevronRight,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export default function AudiencesPage() {
  const [mainTab, setMainTab] = useState<"contacts" | "segments" | "topics">(
    "contacts"
  );

  const [audiences, setAudiences] = useState<AudienceView[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<AudienceView | null>(
    null
  );
  const [contacts, setContacts] = useState<ContactView[]>([]);
  const [segments, setSegments] = useState<SegmentView[]>([]);
  const [topics, setTopics] = useState<TopicView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Contact Detail Drawer State
  const [selectedContact, setSelectedContact] = useState<ContactView | null>(null);
  const [contactSegments, setContactSegments] = useState<SegmentView[]>([]);
  const [contactTopics, setContactTopics] = useState<(TopicView & { status: string })[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Segment Detail Drill-Down State
  const [selectedSegment, setSelectedSegment] = useState<SegmentView | null>(null);
  const [segmentContacts, setSegmentContacts] = useState<ContactView[]>([]);
  const [isSegmentLoading, setIsSegmentLoading] = useState(false);

  // Modals
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [audienceName, setAudienceName] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [unsubscribed, setUnsubscribed] = useState(false);

  // Segment modal
  const [isSegmentOpen, setIsSegmentOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");

  // Topic modal
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [audRes, segRes, topRes] = await Promise.allSettled([
        api.listAudiences(),
        api.listSegments(),
        api.listTopics(),
      ]);

      if (audRes.status === "fulfilled") {
        const list = audRes.value.data || [];
        setAudiences(list);
        if (list.length > 0 && !selectedAudience) {
          setSelectedAudience(list[0]);
          loadContacts(list[0].id);
        } else if (selectedAudience) {
          loadContacts(selectedAudience.id);
        } else {
          loadContacts();
        }
      }

      if (segRes.status === "fulfilled") {
        setSegments(segRes.value.data || []);
      }

      if (topRes.status === "fulfilled") {
        setTopics(topRes.value.data || []);
      }
    } catch (err) {
      console.error("Failed to load audience data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContacts = async (audienceId?: string) => {
    try {
      const res = await api.listContacts(audienceId);
      setContacts(res.data || []);
    } catch (err) {
      console.error("Failed to load contacts", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const aud = await api.createAudience(audienceName.trim());
      setIsAudienceOpen(false);
      setAudienceName("");
      await fetchData();
      setSelectedAudience(aud);
      loadContacts(aud.id);
    } catch (err: any) {
      alert("Failed to create audience: " + err.message);
    }
  };

  const handleDeleteAudience = async (id: string) => {
    if (!confirm("Are you sure you want to delete this audience and all contacts?")) return;
    try {
      await api.deleteAudience(id);
      setSelectedAudience(null);
      fetchData();
    } catch (err: any) {
      alert("Failed to delete audience: " + err.message);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContact({
        email: contactEmail.trim(),
        first_name: contactFirstName.trim() || undefined,
        last_name: contactLastName.trim() || undefined,
        unsubscribed,
        audience_id: selectedAudience?.id,
      });
      setIsContactOpen(false);
      setContactEmail("");
      setContactFirstName("");
      setContactLastName("");
      setUnsubscribed(false);
      loadContacts(selectedAudience?.id);
    } catch (err: any) {
      alert("Failed to create contact: " + err.message);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Remove this contact?")) return;
    try {
      await api.deleteContact(id, selectedAudience?.id);
      loadContacts(selectedAudience?.id);
    } catch (err: any) {
      alert("Failed to delete contact: " + err.message);
    }
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSegment({ name: segmentName.trim() });
      setIsSegmentOpen(false);
      setSegmentName("");
      fetchData();
    } catch (err: any) {
      alert("Failed to create segment: " + err.message);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm("Delete segment?")) return;
    try {
      await api.deleteSegment(id);
      fetchData();
    } catch (err: any) {
      alert("Failed to delete segment: " + err.message);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTopic({
        name: topicName.trim(),
        description: topicDescription.trim() || undefined,
        default_subscription: true,
      });
      setIsTopicOpen(false);
      setTopicName("");
      setTopicDescription("");
      fetchData();
    } catch (err: any) {
      alert("Failed to create topic: " + err.message);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Delete topic?")) return;
    try {
      await api.deleteTopic(id);
      fetchData();
    } catch (err: any) {
      alert("Failed to delete topic: " + err.message);
    }
  };

  const openContactDetail = async (c: ContactView) => {
    setSelectedContact(c);
    setIsDetailLoading(true);
    try {
      const [segRes, topRes] = await Promise.allSettled([
        api.listContactSegments(c.id),
        api.listContactTopics(c.id),
      ]);
      if (segRes.status === "fulfilled") {
        setContactSegments(segRes.value.data || []);
      }
      if (topRes.status === "fulfilled") {
        setContactTopics(topRes.value.data || []);
      }
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleToggleUnsubscribe = async (c: ContactView) => {
    try {
      const updated = await api.updateContact(c.id, {
        unsubscribed: !c.unsubscribed,
        audience_id: selectedAudience?.id,
      });
      setSelectedContact(updated);
      loadContacts(selectedAudience?.id);
    } catch (err: any) {
      alert("Failed to update contact: " + err.message);
    }
  };

  const handleAddSegmentToContact = async (segmentId: string) => {
    if (!selectedContact || !segmentId) return;
    try {
      await api.addContactToSegment(selectedContact.id, segmentId);
      const segRes = await api.listContactSegments(selectedContact.id);
      setContactSegments(segRes.data || []);
    } catch (err: any) {
      alert("Failed to add to segment: " + err.message);
    }
  };

  const handleRemoveSegmentFromContact = async (segmentId: string) => {
    if (!selectedContact) return;
    try {
      await api.removeContactFromSegment(selectedContact.id, segmentId);
      const segRes = await api.listContactSegments(selectedContact.id);
      setContactSegments(segRes.data || []);
    } catch (err: any) {
      alert("Failed to remove from segment: " + err.message);
    }
  };

  const handleToggleTopic = async (topicId: string, currentStatus: string) => {
    if (!selectedContact) return;
    const newStatus = currentStatus === "subscribed" ? "unsubscribed" : "subscribed";
    try {
      await api.updateContactTopic(selectedContact.id, topicId, newStatus);
      const topRes = await api.listContactTopics(selectedContact.id);
      setContactTopics(topRes.data || []);
    } catch (err: any) {
      alert("Failed to update topic: " + err.message);
    }
  };

  const openSegmentDetail = async (seg: SegmentView) => {
    setSelectedSegment(seg);
    setIsSegmentLoading(true);
    try {
      const res = await api.listSegmentContacts(seg.id);
      setSegmentContacts(res.data || []);
    } catch (err) {
      console.error(err);
      setSegmentContacts([]);
    } finally {
      setIsSegmentLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Audiences & Contacts
          </h1>
          <p className="text-xs text-brand-400 mt-1">
            Segment your subscribers, manage topics, and maintain your customer lists.
          </p>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-surface-border bg-surface p-0.5">
            <button
              onClick={() => setMainTab("contacts")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                mainTab === "contacts"
                  ? "bg-surface-raised text-white shadow-sm"
                  : "text-brand-500 hover:text-brand-300"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Contacts</span>
            </button>
            <button
              onClick={() => setMainTab("segments")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                mainTab === "segments"
                  ? "bg-surface-raised text-white shadow-sm"
                  : "text-brand-500 hover:text-brand-300"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Segments</span>
            </button>
            <button
              onClick={() => setMainTab("topics")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                mainTab === "topics"
                  ? "bg-surface-raised text-white shadow-sm"
                  : "text-brand-500 hover:text-brand-300"
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Topics</span>
            </button>
          </div>

          {mainTab === "contacts" && (
            <>
              <button
                onClick={() => setIsAudienceOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-surface-raised hover:text-white transition-colors"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>New Audience</span>
              </button>
              <button
                onClick={() => setIsContactOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </button>
            </>
          )}

          {mainTab === "segments" && (
            <button
              onClick={() => setIsSegmentOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Segment</span>
            </button>
          )}

          {mainTab === "topics" && (
            <button
              onClick={() => setIsTopicOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Topic</span>
            </button>
          )}

          <button
            onClick={fetchData}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-brand-400 hover:bg-surface-raised hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* View 1: Contacts & Audiences */}
      {mainTab === "contacts" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Audience Folders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-brand-400 font-medium">
              <span>Audiences</span>
              <span className="font-mono">{audiences.length}</span>
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setSelectedAudience(null);
                  loadContacts();
                }}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                  selectedAudience === null
                    ? "bg-surface-raised text-white font-semibold"
                    : "text-brand-400 hover:bg-surface hover:text-white"
                }`}
              >
                <span>All Contacts</span>
              </button>

              {audiences.map((aud) => (
                <div
                  key={aud.id}
                  onClick={() => {
                    setSelectedAudience(aud);
                    loadContacts(aud.id);
                  }}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors ${
                    selectedAudience?.id === aud.id
                      ? "bg-surface-raised text-white font-semibold"
                      : "text-brand-400 hover:bg-surface hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="h-3.5 w-3.5 text-brand-500" />
                    <span className="truncate">{aud.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAudience(aud.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-brand-500 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Contacts Table */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between text-xs text-brand-400">
              <span>
                {selectedAudience ? selectedAudience.name : "All Contacts"} (
                {contacts.length})
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-brand-400">
                  <tr>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">First Name</th>
                    <th className="px-5 py-3">Last Name</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Added</th>
                    <th className="px-5 py-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {contacts.length > 0 ? (
                    contacts.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => openContactDetail(c)}
                        className="group cursor-pointer hover:bg-surface-raised/40 transition-colors"
                      >
                        <td className="px-5 py-3 text-white font-medium">
                          {c.email}
                        </td>
                        <td className="px-5 py-3 font-sans text-brand-300">
                          {c.first_name || "—"}
                        </td>
                        <td className="px-5 py-3 font-sans text-brand-300">
                          {c.last_name || "—"}
                        </td>
                        <td className="px-5 py-3 font-sans">
                          {c.unsubscribed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-950/60 border border-red-800/40 px-2 py-0.5 text-[10px] text-red-400">
                              <UserX className="h-2.5 w-2.5" />
                              Unsubscribed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-[10px] text-emerald-400">
                              <UserCheck className="h-2.5 w-2.5" />
                              Subscribed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-brand-500 text-[11px]">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(c.id);
                            }}
                            className="rounded p-1 text-brand-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-brand-500 font-sans">
                        No contacts found in this list. Click "Add Contact" to import.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Segments */}
      {mainTab === "segments" && (
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase font-sans text-brand-400">
              <tr>
                <th className="px-5 py-3">Segment Name</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {segments.length > 0 ? (
                segments.map((seg) => (
                  <tr
                    key={seg.id}
                    onClick={() => openSegmentDetail(seg)}
                    className="group cursor-pointer hover:bg-surface-raised/40 transition-colors"
                  >
                    <td className="px-5 py-3 text-white font-sans font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-sky-400" />
                        <span>{seg.name}</span>
                      </div>
                      <span className="text-[10px] text-brand-400 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        View Enrolled Contacts <ChevronRight className="h-3 w-3" />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-brand-500 text-[11px]">
                      {new Date(seg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSegment(seg.id);
                        }}
                        className="rounded p-1 text-brand-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-xs text-brand-500 font-sans">
                    No segments defined yet. Click "New Segment" to create a dynamic contact group.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View 3: Topics */}
      {mainTab === "topics" && (
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase text-brand-400">
              <tr>
                <th className="px-5 py-3">Topic</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Default Status</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono">
              {topics.length > 0 ? (
                topics.map((top) => (
                  <tr key={top.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="px-5 py-3 text-white font-semibold flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-purple-400" />
                      <span>{top.name}</span>
                    </td>
                    <td className="px-5 py-3 text-brand-300 font-sans">
                      {top.description || "—"}
                    </td>
                    <td className="px-5 py-3 font-sans">
                      <span className="rounded-full bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-[10px] text-emerald-400">
                        Subscribed
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeleteTopic(top.id)}
                        className="rounded p-1 text-brand-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-brand-500 font-sans">
                    No subscription topics created yet. Add topics to allow granular opt-ins.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Audience Modal */}
      {isAudienceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-sm rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-white">Create Audience</h2>
            <form onSubmit={handleCreateAudience} className="space-y-4">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Audience Name
                </label>
                <input
                  type="text"
                  value={audienceName}
                  onChange={(e) => setAudienceName(e.target.value)}
                  placeholder="e.g. Newsletter Subscribers, Beta Testers"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAudienceOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-white">Add Contact</h2>
            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-brand-400 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-brand-400 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="unsub"
                  checked={unsubscribed}
                  onChange={(e) => setUnsubscribed(e.target.checked)}
                  className="rounded border-surface-border bg-surface-raised text-black focus:ring-0"
                />
                <label htmlFor="unsub" className="text-xs text-brand-400">
                  Mark as unsubscribed
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Segment Modal */}
      {isSegmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-sm rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-white">Create Contact Segment</h2>
            <form onSubmit={handleCreateSegment} className="space-y-4">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Segment Name
                </label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g. VIP Customers, Active Users"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSegmentOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
                >
                  Save Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Topic Modal */}
      {isTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-sm rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-white">Create Subscription Topic</h2>
            <form onSubmit={handleCreateTopic} className="space-y-3">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Topic Name
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Product Updates, Security Advisories"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  placeholder="News and alerts regarding our platform."
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTopicOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Detail Slide-over Drawer */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedContact(null)}
          />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-surface-border bg-surface shadow-2xl overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Contact Profile</h2>
                <p className="text-xs font-mono text-brand-400 mt-0.5">{selectedContact.email}</p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="rounded-md p-1.5 text-brand-400 hover:bg-surface-raised hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-400">Subscription Status:</span>
                <button
                  onClick={() => handleToggleUnsubscribe(selectedContact)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                    selectedContact.unsubscribed
                      ? "bg-red-950/60 border-red-800/40 text-red-400 hover:bg-red-900/60"
                      : "bg-emerald-950/60 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/60"
                  }`}
                >
                  {selectedContact.unsubscribed ? (
                    <>
                      <UserX className="h-3 w-3" />
                      Unsubscribed (Click to subscribe)
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3 w-3" />
                      Subscribed (Click to unsubscribe)
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-surface-border bg-surface-raised p-2.5">
                  <span className="text-[10px] text-brand-500 uppercase tracking-wider block">First Name</span>
                  <span className="text-brand-200">{selectedContact.first_name || "—"}</span>
                </div>
                <div className="rounded-lg border border-surface-border bg-surface-raised p-2.5">
                  <span className="text-[10px] text-brand-500 uppercase tracking-wider block">Last Name</span>
                  <span className="text-brand-200">{selectedContact.last_name || "—"}</span>
                </div>
              </div>
            </div>

            {/* Segments Membership */}
            <div className="space-y-3 pt-2 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-sky-400" />
                  Enrolled Segments ({contactSegments.length})
                </span>
              </div>

              <div className="space-y-1.5">
                {contactSegments.length > 0 ? (
                  contactSegments.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs"
                    >
                      <span className="text-brand-200">{s.name}</span>
                      <button
                        onClick={() => handleRemoveSegmentFromContact(s.id)}
                        className="text-brand-500 hover:text-red-400"
                        title="Remove from segment"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-brand-500">Not assigned to any custom segments.</p>
                )}
              </div>

              {/* Add to Segment Picker */}
              {segments.filter((sg) => !contactSegments.some((cs) => cs.id === sg.id)).length > 0 && (
                <div className="pt-2">
                  <label className="block text-[11px] text-brand-400 mb-1">Add to segment:</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSegmentToContact(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-brand-200 focus:outline-none"
                  >
                    <option value="" disabled>Choose a segment...</option>
                    {segments
                      .filter((sg) => !contactSegments.some((cs) => cs.id === sg.id))
                      .map((sg) => (
                        <option key={sg.id} value={sg.id}>
                          {sg.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Topics Preferences */}
            <div className="space-y-3 pt-2 border-t border-surface-border">
              <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-purple-400" />
                Topic Preferences ({contactTopics.length})
              </span>

              <div className="space-y-1.5">
                {contactTopics.length > 0 ? (
                  contactTopics.map((top) => {
                    const isSub = top.status !== "unsubscribed";
                    return (
                      <div
                        key={top.id}
                        className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs"
                      >
                        <div>
                          <p className="text-brand-200 font-medium">{top.name}</p>
                          {top.description && (
                            <p className="text-[10px] text-brand-500">{top.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleTopic(top.id, top.status)}
                          className={`rounded px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                            isSub
                              ? "bg-emerald-950/60 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/60"
                              : "bg-surface border-surface-border text-brand-500 hover:text-white"
                          }`}
                        >
                          {isSub ? "Opted In" : "Opted Out"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-brand-500">No subscription topics configured.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-surface-border">
              <button
                onClick={() => {
                  handleDeleteContact(selectedContact.id);
                  setSelectedContact(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/30 py-2 text-xs text-red-400 hover:bg-red-900/50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Contact</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Enrolled Contacts Modal */}
      {selectedSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-xl rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Filter className="h-4 w-4 text-sky-400" />
                  <span>{selectedSegment.name}</span>
                </h2>
                <p className="text-xs text-brand-400 mt-0.5">
                  {segmentContacts.length} contacts enrolled in this segment
                </p>
              </div>
              <button
                onClick={() => setSelectedSegment(null)}
                className="rounded-md p-1.5 text-brand-400 hover:bg-surface-raised hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-surface-border overflow-hidden rounded-lg border border-surface-border bg-surface-raised">
              {isSegmentLoading ? (
                <div className="py-8 text-center text-xs text-brand-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading enrolled contacts...</span>
                </div>
              ) : segmentContacts.length > 0 ? (
                segmentContacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 text-xs"
                  >
                    <div>
                      <p className="font-mono text-white">{c.email}</p>
                      <p className="text-[11px] text-brand-400">
                        {[c.first_name, c.last_name].filter(Boolean).join(" ") || "No name"}
                      </p>
                    </div>
                    <span className="text-[10px] text-brand-500 font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-brand-500">
                  No contacts enrolled in this segment yet.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSegment(null)}
                className="rounded bg-surface-raised px-4 py-1.5 text-xs text-brand-200 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

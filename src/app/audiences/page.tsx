"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  api,
  AudienceView,
  ContactView,
  SegmentView,
  TopicView,
  ContactBulkImportResponse,
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
  ChevronRight,
  Pencil,
  Sparkles,
  TrendingUp,
  BarChart3,
  Upload,
  FileUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { CursorPagination } from "@/components/ui/CursorPagination";

export default function AudiencesPage() {
  const toast = useToast();
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
  const [contactFilter, setContactFilter] = useState<"all" | "subscribed" | "unsubscribed" | "traits">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [contactsBefore, setContactsBefore] = useState<string | undefined>();
  const [nextContactsBefore, setNextContactsBefore] = useState<string | undefined>();
  const [contactsPageHistory, setContactsPageHistory] = useState<(string | undefined)[]>([]);
  const dataLoadRevision = useRef(0);
  const contactsLoadRevision = useRef(0);

  // Contact Detail Drawer State
  const [selectedContact, setSelectedContact] = useState<ContactView | null>(null);
  const [contactSegments, setContactSegments] = useState<SegmentView[]>([]);
  const [contactTopics, setContactTopics] = useState<(TopicView & { status: string })[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [contactDetailsError, setContactDetailsError] = useState<string | null>(null);

  // Segment Detail Drill-Down State
  const [selectedSegment, setSelectedSegment] = useState<SegmentView | null>(null);
  const [segmentContacts, setSegmentContacts] = useState<ContactView[]>([]);
  const [isSegmentLoading, setIsSegmentLoading] = useState(false);
  const [segmentContactsError, setSegmentContactsError] = useState<string | null>(null);
  const [segmentContactsBefore, setSegmentContactsBefore] = useState<string | undefined>();
  const [nextSegmentContactsBefore, setNextSegmentContactsBefore] = useState<string | undefined>();
  const [segmentContactsPageHistory, setSegmentContactsPageHistory] = useState<(string | undefined)[]>([]);
  const segmentContactsRevision = useRef(0);

  // Modals
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [audienceName, setAudienceName] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactTraitsJson, setContactTraitsJson] = useState("{}");
  const [unsubscribed, setUnsubscribed] = useState(false);

  // Segment modal
  const [isSegmentOpen, setIsSegmentOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [segmentFilterJson, setSegmentFilterJson] = useState("{}");
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  // Topic modal
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [topicVisibility, setTopicVisibility] = useState<"public" | "private">("public");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  // Bulk CSV Importer state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState("");
  const [importSkipDisposable, setImportSkipDisposable] = useState(true);
  const [importSkipRoleBased, setImportSkipRoleBased] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ContactBulkImportResponse | null>(null);

  const fetchData = async () => {
    const revision = ++dataLoadRevision.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [audRes, segRes, topRes] = await Promise.allSettled([
        api.listAudiences(),
        api.listSegments(),
        api.listTopics(),
      ]);
      if (revision !== dataLoadRevision.current) return;
      const failedResources: string[] = [];

      if (audRes.status === "fulfilled") {
        const list = audRes.value.data || [];
        setAudiences(list);
        const nextAudience =
          list.find((audience) => audience.id === selectedAudience?.id) || list[0] || null;
        setSelectedAudience(nextAudience);
        void loadContacts(nextAudience?.id);
      } else {
        failedResources.push("audiences");
      }

      if (segRes.status === "fulfilled") {
        setSegments(segRes.value.data || []);
      } else {
        failedResources.push("segments");
      }

      if (topRes.status === "fulfilled") {
        setTopics(topRes.value.data || []);
      } else {
        failedResources.push("topics");
      }
      if (failedResources.length) {
        setLoadError(`Could not load ${failedResources.join(" and ")}.`);
      }
    } catch (err) {
      if (revision !== dataLoadRevision.current) return;
      console.error("Failed to load audience data", err);
      setLoadError(err instanceof Error ? err.message : "Could not load audience data.");
    } finally {
      if (revision === dataLoadRevision.current) setIsLoading(false);
    }
  };

  const loadContacts = async (
    audienceId?: string,
    before?: string,
    resetPage = true
  ): Promise<boolean> => {
    const revision = ++contactsLoadRevision.current;
    setIsContactsLoading(true);
    setContactsError(null);
    if (resetPage) {
      setContacts([]);
      setContactsBefore(undefined);
      setNextContactsBefore(undefined);
      setContactsPageHistory([]);
    }
    try {
      const res = await api.listContacts(audienceId, 50, before);
      if (revision !== contactsLoadRevision.current) return false;
      setContacts(res.data || []);
      setContactsBefore(before);
      setNextContactsBefore(res.next_before);
      return true;
    } catch (err) {
      if (revision !== contactsLoadRevision.current) return false;
      console.error("Failed to load contacts", err);
      setContactsError(err instanceof Error ? err.message : "Could not load contacts.");
      return false;
    } finally {
      if (revision === contactsLoadRevision.current) setIsContactsLoading(false);
    }
  };

  const loadOlderContacts = async () => {
    if (!nextContactsBefore || isContactsLoading) return;
    const currentBefore = contactsBefore;
    const loaded = await loadContacts(selectedAudience?.id, nextContactsBefore, false);
    if (loaded) setContactsPageHistory((history) => [...history, currentBefore]);
  };

  const loadNewerContacts = async () => {
    if (contactsPageHistory.length === 0 || isContactsLoading) return;
    const previousBefore = contactsPageHistory[contactsPageHistory.length - 1];
    const loaded = await loadContacts(selectedAudience?.id, previousBefore, false);
    if (loaded) setContactsPageHistory((history) => history.slice(0, -1));
  };

  useEffect(() => {
    void fetchData();
    return () => {
      dataLoadRevision.current += 1;
      contactsLoadRevision.current += 1;
    };
  }, []);

  const handleCreateAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const aud = await api.createAudience(audienceName.trim());
      toast.success("Audience created successfully");
      setIsAudienceOpen(false);
      setAudienceName("");
      await fetchData();
      setSelectedAudience(aud);
      void loadContacts(aud.id);
    } catch (err: any) {
      toast.error("Failed to create audience: " + err.message);
    }
  };

  const handleDeleteAudience = async (id: string) => {
    if (!confirm("Are you sure you want to delete this audience and all contacts?")) return;
    try {
      await api.deleteAudience(id);
      toast.success("Audience deleted");
      setSelectedAudience(null);
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to delete audience: " + err.message);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const traits = JSON.parse(contactTraitsJson) as Record<string, unknown>;
      if (!traits || Array.isArray(traits) || typeof traits !== "object") {
        throw new Error("Contact traits must be a JSON object.");
      }
      await api.createContact({
        email: contactEmail.trim(),
        first_name: contactFirstName.trim() || undefined,
        last_name: contactLastName.trim() || undefined,
        unsubscribed,
        audience_id: selectedAudience?.id,
        traits,
      });
      toast.success("Contact added successfully");
      setIsContactOpen(false);
      setContactEmail("");
      setContactFirstName("");
      setContactLastName("");
      setContactTraitsJson("{}");
      setUnsubscribed(false);
      loadContacts(selectedAudience?.id);
    } catch (err: any) {
      toast.error("Failed to create contact: " + err.message);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Remove this contact?")) return;
    try {
      await api.deleteContact(id, selectedAudience?.id);
      toast.success("Contact removed");
      loadContacts(selectedAudience?.id);
    } catch (err: any) {
      toast.error("Failed to delete contact: " + err.message);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText.trim()) {
      toast.error("Please provide CSV data or contact emails to import.");
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await api.bulkImportContacts({
        audience_id: selectedAudience?.id,
        csv_data: importCsvText,
        skip_disposable: importSkipDisposable,
        skip_role_based: importSkipRoleBased,
      });
      setImportResult(res);
      toast.success(`Import complete: ${res.imported} imported, ${res.updated} updated.`);
      loadContacts(selectedAudience?.id);
    } catch (err: any) {
      toast.error("Bulk import failed: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const filter = JSON.parse(segmentFilterJson) as Record<string, unknown>;
      if (!filter || Array.isArray(filter) || typeof filter !== "object") {
        throw new Error("Segment filter must be a JSON object.");
      }
      if (editingSegmentId) {
        await api.updateSegment(editingSegmentId, { name: segmentName.trim(), filter });
        toast.success("Segment updated");
      } else {
        await api.createSegment({ name: segmentName.trim(), filter });
        toast.success("Segment created successfully");
      }
      setIsSegmentOpen(false);
      setSegmentName("");
      setSegmentFilterJson("{}");
      setEditingSegmentId(null);
      await fetchData();
    } catch (err: any) {
      toast.error(`${editingSegmentId ? "Failed to update segment" : "Failed to create segment"}: ${err.message}`);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm("Delete segment?")) return;
    try {
      await api.deleteSegment(id);
      toast.success("Segment deleted");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to delete segment: " + err.message);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: topicName.trim(),
        description: topicDescription.trim() || undefined,
        visibility: topicVisibility,
      };
      if (editingTopicId) {
        await api.updateTopic(editingTopicId, payload);
        toast.success("Topic updated");
      } else {
        await api.createTopic(payload);
        toast.success("Topic created successfully");
      }
      setIsTopicOpen(false);
      setTopicName("");
      setTopicDescription("");
      setTopicVisibility("public");
      setEditingTopicId(null);
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to create topic: " + err.message);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Delete topic?")) return;
    try {
      await api.deleteTopic(id);
      toast.success("Topic deleted");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to delete topic: " + err.message);
    }
  };

  const openContactDetail = async (c: ContactView) => {
    setSelectedContact(c);
    setIsDetailLoading(true);
    setContactDetailsError(null);
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
      if (segRes.status === "rejected" || topRes.status === "rejected") {
        setContactDetailsError("Some contact preferences could not be loaded.");
      }
    } catch (err) {
      setContactDetailsError(err instanceof Error ? err.message : "Could not load contact details.");
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
      toast.success("Contact subscription status updated");
      loadContacts(selectedAudience?.id);
    } catch (err: any) {
      toast.error("Failed to update contact: " + err.message);
    }
  };

  const handleAddSegmentToContact = async (segmentId: string) => {
    if (!selectedContact || !segmentId) return;
    try {
      await api.addContactToSegment(selectedContact.id, segmentId);
      const segRes = await api.listContactSegments(selectedContact.id);
      setContactSegments(segRes.data || []);
      toast.success("Added to segment");
    } catch (err: any) {
      toast.error("Failed to add to segment: " + err.message);
    }
  };

  const handleRemoveSegmentFromContact = async (segmentId: string) => {
    if (!selectedContact) return;
    try {
      await api.removeContactFromSegment(selectedContact.id, segmentId);
      const segRes = await api.listContactSegments(selectedContact.id);
      setContactSegments(segRes.data || []);
      toast.success("Removed from segment");
    } catch (err: any) {
      toast.error("Failed to remove from segment: " + err.message);
    }
  };

  const handleToggleTopic = async (topicId: string, currentStatus: string) => {
    if (!selectedContact) return;
    const newStatus = currentStatus === "subscribed" ? "unsubscribed" : "subscribed";
    try {
      await api.updateContactTopic(selectedContact.id, topicId, newStatus);
      const topRes = await api.listContactTopics(selectedContact.id);
      setContactTopics(topRes.data || []);
      toast.success(`Topic set to ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update topic: " + err.message);
    }
  };

  const loadSegmentContacts = async (
    seg: SegmentView,
    before?: string,
    resetPage = true
  ): Promise<boolean> => {
    const revision = ++segmentContactsRevision.current;
    setSelectedSegment(seg);
    setIsSegmentLoading(true);
    setSegmentContactsError(null);
    if (resetPage) {
      setSegmentContacts([]);
      setSegmentContactsBefore(undefined);
      setNextSegmentContactsBefore(undefined);
      setSegmentContactsPageHistory([]);
    }
    try {
      const res = await api.listSegmentContacts(seg.id, 50, before);
      if (revision !== segmentContactsRevision.current) return false;
      setSegmentContacts(res.data || []);
      setSegmentContactsBefore(before);
      setNextSegmentContactsBefore(res.next_before);
      return true;
    } catch (err) {
      if (revision !== segmentContactsRevision.current) return false;
      console.error(err);
      setSegmentContacts([]);
      setSegmentContactsError(err instanceof Error ? err.message : "Could not load enrolled contacts.");
      return false;
    } finally {
      if (revision === segmentContactsRevision.current) setIsSegmentLoading(false);
    }
  };

  const openSegmentDetail = (seg: SegmentView) => {
    void loadSegmentContacts(seg);
  };

  const loadOlderSegmentContacts = async () => {
    if (!selectedSegment || !nextSegmentContactsBefore || isSegmentLoading) return;
    const currentBefore = segmentContactsBefore;
    if (await loadSegmentContacts(selectedSegment, nextSegmentContactsBefore, false)) {
      setSegmentContactsPageHistory((history) => [...history, currentBefore]);
    }
  };

  const loadNewerSegmentContacts = async () => {
    if (!selectedSegment || segmentContactsPageHistory.length === 0 || isSegmentLoading) return;
    const previousBefore = segmentContactsPageHistory[segmentContactsPageHistory.length - 1];
    if (await loadSegmentContacts(selectedSegment, previousBefore, false)) {
      setSegmentContactsPageHistory((history) => history.slice(0, -1));
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Audiences & Contacts
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Segment your subscribers, manage topics, and maintain your customer lists.
          </p>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-surface-border bg-surface p-0.5">
            <button
              onClick={() => setMainTab("contacts")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mainTab === "contacts"
                  ? "bg-surface-raised text-zinc-900 dark:text-white font-medium shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Contacts</span>
            </button>
            <button
              onClick={() => setMainTab("segments")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mainTab === "segments"
                  ? "bg-surface-raised text-zinc-900 dark:text-white font-medium shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Segments</span>
            </button>
            <button
              onClick={() => setMainTab("topics")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mainTab === "topics"
                  ? "bg-surface-raised text-zinc-900 dark:text-white font-medium shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
                className="btn-secondary"
              >
                <FolderPlus className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>New Audience</span>
              </button>
              <button
                onClick={() => {
                  setImportResult(null);
                  setIsImportOpen(true);
                }}
                className="btn-secondary"
              >
                <Upload className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => setIsContactOpen(true)}
                className="btn-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </button>
            </>
          )}

          {mainTab === "segments" && (
            <button
              onClick={() => setIsSegmentOpen(true)}
              className="btn-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Segment</span>
            </button>
          )}

          {mainTab === "topics" && (
            <button
              onClick={() => setIsTopicOpen(true)}
              className="btn-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Topic</span>
            </button>
          )}

          <button
            onClick={() => {
              api.clearCache();
              void fetchData();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loadError && <ErrorState message={loadError} onRetry={fetchData} />}
      {mainTab === "contacts" && contactsError && (
        <ErrorState
          message={contactsError}
          onRetry={() => loadContacts(selectedAudience?.id)}
        />
      )}

      {/* View 1: Contacts & Audiences */}
      {mainTab === "contacts" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Audience Folders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span>Audiences</span>
              <span className="font-mono">{audiences.length}</span>
            </div>

            {isLoading && audiences.length === 0 ? (
              <TableSkeleton rows={4} cols={1} />
            ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setSelectedAudience(null);
                  void loadContacts();
                }}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                  selectedAudience === null
                    ? "bg-surface-raised text-zinc-900 dark:text-white font-semibold"
                    : "text-zinc-600 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                <span>All Contacts</span>
              </button>

              {audiences.map((aud) => (
                <div
                  key={aud.id}
                  onClick={() => {
                    setSelectedAudience(aud);
                    void loadContacts(aud.id);
                  }}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors ${
                    selectedAudience?.id === aud.id
                      ? "bg-surface-raised text-zinc-900 dark:text-white font-semibold"
                      : "text-zinc-600 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span className="truncate">{aud.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAudience(aud.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {!isLoading && !loadError && audiences.length === 0 && (
                <p className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">No audiences yet.</p>
              )}
            </div>
            )}
            {(contactsPageHistory.length > 0 || nextContactsBefore) && (
              <CursorPagination
                page={contactsPageHistory.length + 1}
                canGoNewer={contactsPageHistory.length > 0}
                canGoOlder={Boolean(nextContactsBefore)}
                isLoading={isContactsLoading}
                onNewer={() => void loadNewerContacts()}
                onOlder={() => void loadOlderContacts()}
              />
            )}
          </div>

          {/* Right: Contacts Table */}
          <div className="lg:col-span-3 space-y-4">
            {/* Audience Health & Growth Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-surface-border bg-surface p-3">
                <span className="text-[10px] uppercase font-sans text-zinc-500 block">Total Audience</span>
                <span className="text-base font-bold text-zinc-900 dark:text-white font-mono">{contacts.length}</span>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface p-3">
                <span className="text-[10px] uppercase font-sans text-zinc-500 block">Deliverable</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {contacts.length > 0 ? `${Math.round((contacts.filter(c => !c.unsubscribed).length / contacts.length) * 100)}%` : "100%"}
                </span>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface p-3">
                <span className="text-[10px] uppercase font-sans text-zinc-500 block">Suppressed</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {contacts.filter(c => c.unsubscribed).length}
                </span>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface p-3">
                <span className="text-[10px] uppercase font-sans text-zinc-500 block">Dynamic Segments</span>
                <span className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">{segments.length}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-white">
                {selectedAudience ? selectedAudience.name : "All Contacts"} ({contacts.filter((c) => {
                  if (contactFilter === "subscribed") return !c.unsubscribed;
                  if (contactFilter === "unsubscribed") return c.unsubscribed;
                  if (contactFilter === "traits") return c.traits && Object.keys(c.traits).length > 0;
                  return true;
                }).length})
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["all", "subscribed", "unsubscribed", "traits"] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setContactFilter(filterKey)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      contactFilter === filterKey
                        ? "bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 font-bold border border-teal-500/30"
                        : "hover:bg-surface-raised text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {filterKey === "all" ? "All Contacts" : filterKey === "traits" ? "Has Custom Traits" : filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {isContactsLoading && contacts.length === 0 ? (
              <TableSkeleton rows={5} cols={6} />
            ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-sm">
              <table className="w-full text-left text-sm min-w-[550px]">
                <thead className="border-b border-surface-border bg-surface-raised text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">First Name</th>
                    <th className="px-4 py-3 font-medium">Last Name</th>
                    <th className="px-4 py-3 font-medium">Status &amp; Tier</th>
                    <th className="px-4 py-3 font-medium">Added</th>
                    <th className="px-4 py-3 font-medium text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {contacts.filter((c) => {
                    if (contactFilter === "subscribed") return !c.unsubscribed;
                    if (contactFilter === "unsubscribed") return c.unsubscribed;
                    if (contactFilter === "traits") return c.traits && Object.keys(c.traits).length > 0;
                    return true;
                  }).length > 0 ? (
                    contacts.filter((c) => {
                      if (contactFilter === "subscribed") return !c.unsubscribed;
                      if (contactFilter === "unsubscribed") return c.unsubscribed;
                      if (contactFilter === "traits") return c.traits && Object.keys(c.traits).length > 0;
                      return true;
                    }).map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => openContactDetail(c)}
                        className="group cursor-pointer hover:bg-surface-raised/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-[13px] text-zinc-900 dark:text-white">
                          {c.email}
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {c.first_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {c.last_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {c.unsubscribed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] text-red-700 dark:bg-red-950/60 dark:border-red-800/40 dark:text-red-400">
                                <UserX className="h-2.5 w-2.5" />
                                Unsubscribed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800/40 dark:text-emerald-400">
                                <UserCheck className="h-2.5 w-2.5" />
                                Subscribed
                              </span>
                            )}
                            {c.traits && Object.keys(c.traits).length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] text-teal-800 dark:bg-teal-950/60 dark:border-teal-800/40 dark:text-teal-300 font-mono">
                                <Sparkles className="h-2.5 w-2.5" />
                                {Object.keys(c.traits).length} traits
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(c.id);
                            }}
                            className="rounded p-1 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                        No contacts found matching the selected filter. Click "Add Contact" to import.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {/* View 2: Segments */}
      {mainTab === "segments" && (
        isLoading && segments.length === 0 ? (
          <TableSkeleton rows={5} cols={3} />
        ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-sm">
          <table className="w-full text-left text-sm min-w-[450px]">
            <thead className="border-b border-surface-border bg-surface-raised text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Segment Name</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Delete</th>
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
                    <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                        <span>{seg.name}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        View Enrolled Contacts <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {new Date(seg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSegmentId(seg.id);
                          setSegmentName(seg.name);
                          setSegmentFilterJson(JSON.stringify(seg.filter || {}, null, 2));
                          setIsSegmentOpen(true);
                        }}
                        title="Edit segment"
                        className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSegment(seg.id);
                        }}
                        className="rounded p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No segments defined yet. Click "New Segment" to create a dynamic contact group.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )
      )}

      {/* View 3: Topics */}
      {mainTab === "topics" && (
        isLoading && topics.length === 0 ? (
          <TableSkeleton rows={5} cols={4} />
        ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase text-zinc-500 dark:text-zinc-400">
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
                    <td className="px-5 py-3 text-zinc-900 dark:text-white font-semibold flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />
                      <span>{top.name}</span>
                    </td>
                    <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300 font-sans">
                      {top.description || "—"}
                    </td>
                    <td className="px-5 py-3 font-sans">
                      <span className="badge badge-neutral capitalize">
                        {top.visibility}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingTopicId(top.id);
                          setTopicName(top.name);
                          setTopicDescription(top.description || "");
                          setTopicVisibility(top.visibility === "private" ? "private" : "public");
                          setIsTopicOpen(true);
                        }}
                        title="Edit topic"
                        className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(top.id)}
                        className="rounded p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                    No subscription topics created yet. Add topics to allow granular opt-ins.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )
      )}

      {/* New Audience Modal */}
      {isAudienceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-sm rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Create Audience</h2>
            <form onSubmit={handleCreateAudience} className="space-y-4">
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Audience Name
                </label>
                <input
                  type="text"
                  value={audienceName}
                  onChange={(e) => setAudienceName(e.target.value)}
                  placeholder="e.g. Newsletter Subscribers, Beta Testers"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAudienceOpen(false)}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-1.5 text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Add Contact</h2>
            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="unsub"
                  checked={unsubscribed}
                  onChange={(e) => setUnsubscribed(e.target.checked)}
                  className="rounded border-surface-border bg-surface-raised text-zinc-900 focus:ring-0"
                />
                <label htmlFor="unsub" className="text-xs text-zinc-600 dark:text-zinc-400">
                  Mark as unsubscribed
                </label>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Custom traits (JSON object)</label>
                <textarea
                  value={contactTraitsJson}
                  onChange={(event) => setContactTraitsJson(event.target.value)}
                  rows={3}
                  spellCheck={false}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactOpen(false)}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-1.5 text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-sm rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{editingSegmentId ? "Edit Contact Segment" : "Create Contact Segment"}</h2>
            <form onSubmit={handleCreateSegment} className="space-y-4">
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Segment Name
                </label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g. VIP Customers, Active Users"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Filter definition (JSON)</label>
                <textarea
                  value={segmentFilterJson}
                  onChange={(event) => setSegmentFilterJson(event.target.value)}
                  rows={5}
                  spellCheck={false}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSegmentOpen(false);
                    setEditingSegmentId(null);
                    setSegmentFilterJson("{}");
                  }}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-1.5 text-xs"
                >
                  {editingSegmentId ? "Save Changes" : "Save Segment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Topic Modal */}
      {isTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-sm rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{editingTopicId ? "Edit Subscription Topic" : "Create Subscription Topic"}</h2>
            <form onSubmit={handleCreateTopic} className="space-y-3">
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Topic Name
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Product Updates, Security Advisories"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Visibility</label>
                <select
                  value={topicVisibility}
                  onChange={(event) => setTopicVisibility(event.target.value as "public" | "private")}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  placeholder="News and alerts regarding our platform."
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTopicOpen(false);
                    setEditingTopicId(null);
                  }}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-1.5 text-xs"
                >
                  {editingTopicId ? "Save Changes" : "Save Topic"}
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
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Contact Profile</h2>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">{selectedContact.email}</p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isDetailLoading && (
              <div role="status" className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading contact preferences...
              </div>
            )}
            {contactDetailsError && (
              <ErrorState message={contactDetailsError} onRetry={() => openContactDetail(selectedContact)} />
            )}

            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Subscription Status:</span>
                <button
                  onClick={() => handleToggleUnsubscribe(selectedContact)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                    selectedContact.unsubscribed
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/60 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-900/60"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-800/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
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
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">First Name</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{selectedContact.first_name || "—"}</span>
                </div>
                <div className="rounded-lg border border-surface-border bg-surface-raised p-2.5">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Last Name</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{selectedContact.last_name || "—"}</span>
                </div>
              </div>
            </div>

            {selectedContact.traits && Object.keys(selectedContact.traits).length > 0 && (
              <section className="space-y-2 border-t border-surface-border pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-content-primary">Custom traits</h3>
                <pre className="overflow-x-auto rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-[11px] text-content-secondary">
                  {JSON.stringify(selectedContact.traits, null, 2)}
                </pre>
              </section>
            )}

            {/* Segments Membership */}
            <div className="space-y-3 pt-2 border-t border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />
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
                      <span className="text-zinc-800 dark:text-zinc-200">{s.name}</span>
                      <button
                        onClick={() => handleRemoveSegmentFromContact(s.id)}
                        className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Remove from segment"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Not assigned to any custom segments.</p>
                )}
              </div>

              {/* Add to Segment Picker */}
              {segments.filter((sg) => !contactSegments.some((cs) => cs.id === sg.id)).length > 0 && (
                <div className="pt-2">
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Add to segment:</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSegmentToContact(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
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
              <span className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />
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
                          <p className="text-zinc-900 dark:text-zinc-200 font-medium">{top.name}</p>
                          {top.description && (
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{top.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleTopic(top.id, top.status)}
                          className={`rounded px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                            isSub
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-800/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
                              : "bg-surface border-surface-border text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          {isSub ? "Opted In" : "Opted Out"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">No subscription topics configured.</p>
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
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 py-2 text-xs dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-xl rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Filter className="h-4 w-4 text-teal-600 dark:text-teal-300" />
                  <span>{selectedSegment.name}</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {segmentContacts.length} contacts on this page
                </p>
              </div>
              <button
                onClick={() => {
                  segmentContactsRevision.current += 1;
                  setSelectedSegment(null);
                }}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-surface-border overflow-hidden rounded-lg border border-surface-border bg-surface-raised">
              {segmentContactsError ? (
                <ErrorState message={segmentContactsError} onRetry={() => openSegmentDetail(selectedSegment)} />
              ) : isSegmentLoading ? (
                <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
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
                      <p className="font-mono text-zinc-900 dark:text-white">{c.email}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {[c.first_name, c.last_name].filter(Boolean).join(" ") || "No name"}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No contacts enrolled in this segment yet.
                </div>
              )}
            </div>

            {(segmentContactsPageHistory.length > 0 || nextSegmentContactsBefore) && (
              <CursorPagination
                page={segmentContactsPageHistory.length + 1}
                canGoNewer={segmentContactsPageHistory.length > 0}
                canGoOlder={Boolean(nextSegmentContactsBefore)}
                isLoading={isSegmentLoading}
                onNewer={() => void loadNewerSegmentContacts()}
                onOlder={() => void loadOlderSegmentContacts()}
              />
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  segmentContactsRevision.current += 1;
                  setSelectedSegment(null);
                }}
                className="rounded-md border border-surface-border px-4 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk CSV Contact Importer */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Bulk Import Contacts &amp; Data Hygiene
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Import to: <strong className="text-zinc-700 dark:text-zinc-300">{selectedAudience?.name || "All Contacts"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    CSV Content or Email List
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setImportCsvText(
                        "email,first_name,last_name\nalex@acme.corp,Alex,Smith\njane@fintech.io,Jane,Doe\nsam@startup.dev,Sam,Altman"
                      );
                    }}
                    className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Load Sample CSV
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="Paste CSV rows (e.g. email,first_name,last_name) or one email per line..."
                  className="w-full rounded-lg border border-surface-border bg-surface-raised p-2.5 font-mono text-[11px] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Hygiene Guards */}
              <div className="space-y-2 rounded-xl border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                  Automated Deliverability &amp; Hygiene Guards
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={importSkipDisposable}
                    onChange={(e) => setImportSkipDisposable(e.target.checked)}
                    className="rounded border-surface-border text-teal-600 focus:ring-teal-500"
                  />
                  <span>Block disposable &amp; burner mail providers (mailinator, guerrillamail, tempmail)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={importSkipRoleBased}
                    onChange={(e) => setImportSkipRoleBased(e.target.checked)}
                    className="rounded border-surface-border text-teal-600 focus:ring-teal-500"
                  />
                  <span>Filter shared department role addresses (admin@, support@, info@)</span>
                </label>
              </div>

              {/* Import Results Telemetry */}
              {importResult && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs space-y-1.5 text-emerald-900 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Import Completed Successfully</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-zinc-500 block">Total:</span>
                      <strong className="font-mono">{importResult.total_processed}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-600 block">Imported:</span>
                      <strong className="font-mono text-emerald-600">{importResult.imported}</strong>
                    </div>
                    <div>
                      <span className="text-teal-600 block">Updated:</span>
                      <strong className="font-mono text-teal-600">{importResult.updated}</strong>
                    </div>
                    <div>
                      <span className="text-rose-500 block">Invalid:</span>
                      <strong className="font-mono">{importResult.invalid}</strong>
                    </div>
                    <div>
                      <span className="text-amber-500 block">Disposable:</span>
                      <strong className="font-mono">{importResult.disposable}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Role-Based:</span>
                      <strong className="font-mono">{importResult.role_based}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="rounded-md border border-surface-border px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-surface-raised dark:text-zinc-300"
                >
                  {importResult ? "Done" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importCsvText.trim()}
                  className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs"
                >
                  {isImporting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>{isImporting ? "Processing CSV..." : "Start Batch Ingestion"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

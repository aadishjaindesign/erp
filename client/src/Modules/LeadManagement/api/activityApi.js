const STORAGE_KEY = "leadActivities";

const getLocalActivities = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const setLocalActivities = (activities) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
};

const generateId = () => {
  return "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
};

export const activityApi = {
  getActivitiesByLead: async (leadId) => {
    const activities = getLocalActivities();
    return activities.filter((a) => a.leadId === leadId).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  createActivity: async (activityData) => {
    const { leadId, leadName, staffName, callStatus, notes, followUpDate } = activityData;
    const activity = {
      _id: generateId(),
      leadId,
      leadName,
      staffName,
      callStatus,
      notes: notes.trim(),
      followUpDate: followUpDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const activities = getLocalActivities();
    activities.push(activity);
    setLocalActivities(activities);

    return activity;
  },

  updateActivity: async (id, data) => {
    const activities = getLocalActivities();
    const idx = activities.findIndex((a) => a._id === id || a.id === id);
    if (idx !== -1) {
      activities[idx] = { ...activities[idx], ...data, updatedAt: new Date().toISOString() };
      setLocalActivities(activities);
      return activities[idx];
    }
    throw new Error("Activity not found");
  },

  deleteActivity: async (id) => {
    const activities = getLocalActivities();
    const filtered = activities.filter((a) => a._id !== id && a.id !== id);
    setLocalActivities(filtered);
    return true;
  },

  getStaffSummary: async () => {
    const activities = getLocalActivities();
    const latestMap = {};
    activities.forEach((a) => {
      if (!a.leadId) return;
      const existing = latestMap[a.leadId];
      if (!existing || new Date(a.createdAt) > new Date(existing.createdAt)) {
        latestMap[a.leadId] = {
          leadId: a.leadId,
          staffName: a.staffName,
          callStatus: a.callStatus,
          notes: a.notes,
          createdAt: a.createdAt,
          followUpDate: a.followUpDate || null,
        };
      }
    });
    return Object.values(latestMap);
  }
};

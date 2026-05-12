import { create } from 'zustand';
import { supabase } from '../utils/supabase'; // TAMA NA PATH: Mula store, akyat sa src, pasok sa utils

/**
 * AUTH STORE: Persistent Cache & Cloud Sync Architecture
 * Layunin: Imbak ng data mula sa Supabase.
 * Features: 
 * 1. Admin Cloud Sync - Ang Super Admin lang ang nagse-save sa database.
 * 2. Branch Broadcast - Lahat ng members sa iisang zion_code ay nakakakita ng iisang goal.
 * 3. Syntax Error Safe - Hindi gumagamit ng 'persist' middleware.
 */
const useAuthStore = create((set, get) => ({
  // 1. ORIGINAL STATE VARIABLES (Critical for Navigation & Auth)
  user: null,           // full_name o user_name
  role: null,           // member o super_admin
  zionCode: null,       // PLA, MLS, CAL
  isApproved: false,    // Approval status
  userProfile: null,    // Buong profile object para sa ibang details

  // 2. GOAL CARD STATE (Shared via Cloud)
  savedGoal: {
    attStu1: 0, attStu4: 0, attStuT: 0,
    attOver1: 0, attOver4: 0, attOverT: 0,
    simpleP: 0, validP: 0, fruitB: 0,
    evangelists: []
  },

  // 3. ACTIONS (Integrated with Supabase branch_goals table)

  /**
   * setAuth: Ginagamit sa Login.
   * Sinisiguro nito na ang top-level variables ay updated para sa Navigation logic.
   */
  setAuth: (userData) => {
    console.log("📦 STORE CACHE UPDATE:", userData ? "Profile Received" : "Empty Profile");
    
    set({
      user: userData?.full_name || userData?.user_name || 'Guest',
      role: userData?.role || 'member',
      zionCode: userData?.zion_code || null,
      isApproved: userData?.is_approved ?? false,
      userProfile: userData || null,
    });
  },

  /**
   * setUserProfile: Ginagamit para sa updates (Avatar, etc.)
   */
  setUserProfile: (profileData) => {
    set((state) => ({
      userProfile: profileData,
      user: profileData?.full_name || profileData?.user_name || state.user,
      zionCode: profileData?.zion_code || state.zionCode,
      isApproved: profileData?.is_approved ?? state.isApproved,
    }));
  },

  /**
   * setSavedGoal: Admin Only Action.
   * Sine-save ang data sa 'branch_goals' table sa Supabase.
   * GUMAGAMIT NG UPSERT para sa automatic overwrite base sa zion_code.
   */
  setSavedGoal: async (newData) => {
    const { zionCode, role } = get();
    
    // Security Check: Admin lang ang pwedeng mag-upload sa Cloud
    if (role !== 'super_admin') {
      console.error("❌ Unauthorized: Only Super Admin can set goals.");
      return;
    }

    const updatedGoal = { ...get().savedGoal, ...newData };
    
    // Update Local State agad para mabilis ang UI
    set({ savedGoal: updatedGoal });

    try {
      // Upsert sa Supabase: Kung may existing zion_code, update. Kung wala, insert.
      // Kinakailangan na ang 'zion_code' ay Primary Key sa database table.
      const { error } = await supabase
        .from('branch_goals')
        .upsert(
          { 
            zion_code: zionCode, 
            goal_data: updatedGoal,
            updated_at: new Date().toISOString() 
          }, 
          { onConflict: 'zion_code' }
        );

      if (error) throw error;
      console.log("✅ CLOUD SYNC: Goal updated for branch", zionCode);
    } catch (e) {
      console.error("❌ Cloud Save Error:", e.message);
    }
  },

  /**
   * loadSavedGoal: Tinatawag sa Dashboard.
   * Kinukuha ang shared goal ng branch mula sa Supabase.
   */
  loadSavedGoal: async () => {
    const { zionCode } = get();
    if (!zionCode) return;

    try {
      const { data, error } = await supabase
        .from('branch_goals')
        .select('goal_data')
        .eq('zion_code', zionCode)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No data found
      
      if (data) {
        set({ savedGoal: data.goal_data });
        console.log("✅ CLOUD LOAD: Goal fetched for", zionCode);
      }
    } catch (e) {
      console.error("❌ Cloud Load Error:", e.message);
    }
  },

  /**
   * clearAuth: Ginagamit sa Logout.
   * Nililinis ang lahat ng memory.
   */
  clearAuth: () => {
    console.log("🧹 STORE CACHE CLEARED");
    set({
      user: null,
      role: null,
      zionCode: null,
      isApproved: false,
      userProfile: null,
      savedGoal: {
        attStu1: 0, attStu4: 0, attStuT: 0,
        attOver1: 0, attOver4: 0, attOverT: 0,
        simpleP: 0, validP: 0, fruitB: 0,
        evangelists: []
      },
    });
  },
}));

export default useAuthStore;
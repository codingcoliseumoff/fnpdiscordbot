const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const db = {
    // User functions
    async getUser(userId, username) {
        let { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();
        if (!data) {
            const { data: newUser, error: createError } = await supabase.from('users').insert([{ user_id: userId, username }]).select().single();
            return newUser;
        }
        return data;
    },

    async updateMoney(userId, amount) {
        const { data, error } = await supabase.rpc('increment_money', { user_id_val: userId, amount_val: amount });
        return data;
    },

    // Team functions
    async getTeam(userId) {
        const { data, error } = await supabase.from('teams').select('*').eq('owner_user_id', userId).single();
        return data;
    },

    async createTeam(userId, name, color, websiteName) {
        const { data, error } = await supabase.from('teams').insert([{ owner_user_id: userId, name, color, website_name: websiteName }]).select().single();
        return data;
    },

    // Driver functions
    async getDrivers(teamId) {
        const { data, error } = await supabase.from('drivers').select('*').eq('team_id', teamId);
        return data;
    },

    async updateDriverStats(driverId, stats) {
        const { data, error } = await supabase.from('drivers').update(stats).eq('id', driverId);
        return data;
    },

    // Global Stats
    async getGlobalLeaderboard(type = 'money') {
        const { data, error } = await supabase.from('users').select('*').order(type, { ascending: false }).limit(10);
        return data;
    }
};

module.exports = { db, supabase };

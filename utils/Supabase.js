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

    async createTeam(userId, name, color, websiteName, tier = 1) {
        const { data, error } = await supabase.from('teams').insert([{ owner_user_id: userId, name, color, website_name: websiteName, tier }]).select().single();
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
    async getLeaderboard(type = 'money', limit = 10) {
        const { data, error } = await supabase.from('users').select('*').order(type, { ascending: false }).limit(limit);
        return data || [];
    },

    // Lobby functions
    async createLobby(code, host_id, server_id) {
        const { data, error } = await supabase.from('lobbies').insert([{ code, host_id, server_id, status: 'waiting', players: JSON.stringify([{ id: host_id }]) }]).select().single();
        return data;
    },

    async getLobbies(server_id) {
        const { data, error } = await supabase.from('lobbies').select('*').eq('server_id', server_id).eq('status', 'waiting');
        return data || [];
    },

    // Tournament functions
    async getCurrentTournament(server_id) {
        let { data, error } = await supabase.from('server_tournaments').select('*').eq('server_id', server_id).eq('status', 'active').maybeSingle();
        return data;
    },

    async createTournament(server_id, rounds = 24) {
        const { data, error } = await supabase.from('server_tournaments').insert([{ server_id, total_rounds: rounds, status: 'active' }]).select().single();
        if (error) {
            console.error("DB Error in createTournament:", error);
            throw error;
        }
        return data;
    },

    async resetTournament(server_id) {
        const { data, error } = await supabase.from('server_tournaments').update({ current_round: 0 }).eq('server_id', server_id);
        return data;
    },

    async endTournament(server_id) {
        const { data, error } = await supabase.from('server_tournaments').update({ status: 'ended' }).eq('server_id', server_id);
        return data;
    },
    
    supabase: supabase
};

module.exports = { db, supabase };

"use strict";
const axios = require("axios");

class playerUtils{
    constructor(){}

    static async getPlayerData(username){
        try {
            const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
            const result= await axios.get(url);
            let uuidRes = result.data.id 
            let usernameRes = result.data.name
            let correctUUID = uuidRes.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
            return { username: usernameRes, uuid: correctUUID };
    
        } catch (err) {
            console.error(err);
        }
    }

} 

module.exports = playerUtils;

export default {
  roles: {
    controlRoom: { name: "Control Room", color: "PURPLE", permissions: "ADMINISTRATOR" },
    staff: { name: "Staff", color: "BLUE" },
    spectator: { name: "Spectator", color: "AQUA" },
    playerCoach: { name: "Player/Coach", color: "RED" },
  },
  channels: {
    // Control Room
    controlRoomCategory: {
      name: "Control Room",
      type: "category",
      overwrites: [
        ["everyone", { VIEW_CHANNEL: false }],
        ["staff", { VIEW_CHANNEL: true }],
      ],
    },
    linksText: {
      name: "announcements-and-links",
      parent: "controlRoomCategory",
      type: "text",
      overwrites: [["staff", { SEND_MESSAGES: false }]],
    },
    // packetsText: {
    //   name: "packets",
    //   parent: "controlRoomCategory",
    //   type: "text",
    //   overwrites: ["staff", { SEND_MESSAGES: false }],
    // },
    protestsText: { name: "protests", parent: "controlRoomCategory", type: "text" },
    botCommandsText: { name: "bot-commands", parent: "controlRoomCategory", type: "text" },
    controlRoomText: { name: "control-room", parent: "controlRoomCategory", type: "text" },
    controlRoomVoice: { name: "control-room-voice", parent: "controlRoomCategory", type: "voice" },

    // Hub
    hubCategory: { name: "Hub", type: "category" },
    announcementsText: {
      name: "announcements",
      parent: "hubCategory",
      type: "text",
      overwrites: [["everyone", { SEND_MESSAGES: false }]],
    },
    generalText: { name: "general", parent: "hubCategory", type: "text" },
    hallwayVoice: { name: "hallway-voice", parent: "hubCategory", type: "voice" },

    // Honor Pledge
    honorPledgeCategory: { name: "Honor Pledge", type: "category" },
    honorPledgeText: {
      name: "honor-pledge",
      parent: "honorPledgeCategory",
      type: "text",
      overwrites: [[["staff", "spectator", "playerCoach"], { SEND_MESSAGES: false }]],
    },
  },
};

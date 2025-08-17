const { addMessage, getMessages, markMessagesAsSeen, deleteMessage, reactToMessage } = require("../controllers/messageController");
const router = require("express").Router();



router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);
router.post("/markseen/", markMessagesAsSeen);
router.post("/deletemsg/", deleteMessage);
router.post("/reactmsg/", reactToMessage);

module.exports = router;

const Contact = require("../models/Contact");

// Get all contacts
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.render("admin/contacts/index", { 
      title: "Quản Lý Liên Hệ", 
      contacts,
      success: req.query.success 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin");
  }
};

// Get contact detail
exports.getContactDetail = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (contact.status === "new") {
      contact.status = "read";
      await contact.save();
    }
    
    res.render("admin/contacts/detail", { 
      title: "Chi Tiết Liên Hệ", 
      contact 
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/contacts");
  }
};

// Reply to contact
exports.replyContact = async (req, res) => {
  try {
    const { reply } = req.body;
    await Contact.findByIdAndUpdate(req.params.id, { 
      reply, 
      status: "replied" 
    });
    res.redirect(`/admin/contacts/${req.params.id}?success=Gửi phản hồi thành công`);
  } catch (error) {
    console.error(error);
    res.redirect("/admin/contacts");
  }
};

// Delete contact
exports.deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.redirect("/admin/contacts?success=Xóa thành công");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/contacts");
  }
};

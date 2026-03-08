const Contact = require("../models/Contact");
const User = require("../models/User");
const Order = require("../models/Order");
const Notification = require("../models/Notification");

// Get all contacts with filter
exports.getContacts = async (req, res) => {
  try {
    const typeFilter = req.query.type || "all";

    // If viewing order reviews, fetch from Order model instead
    if (typeFilter === "reviews") {
      const orderReviews = await Order.find({ rating: { $exists: true, $ne: null } })
        .populate("userId", "name email phone")
        .populate("branchId", "name")
        .populate("shipperId", "name")
        .populate("staffId", "name")
        .sort({ ratedAt: -1 });

      return res.render("admin/contacts/index", {
        title: "Quan Ly Phan Hoi",
        contacts: [],
        orderReviews,
        typeFilter,
        success: req.query.success,
      });
    }

    let query = {};
    if (typeFilter === "feedback") query.type = "feedback";
    else if (typeFilter === "shipper") query.type = "shipper_application";
    else if (typeFilter === "staff") query.type = "staff_application";

    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    res.render("admin/contacts/index", { 
      title: "Quan Ly Phan Hoi", 
      contacts,
      orderReviews: [],
      typeFilter,
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
    const contact = await Contact.findById(req.params.id).populate("branchId", "name address");
    
    if (contact.status === "new") {
      contact.status = "read";
      await contact.save();
    }
    
    res.render("admin/contacts/detail", { 
      title: "Chi Tiet Lien He", 
      contact,
      success: req.query.success
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
    res.redirect("/admin/contacts?success=Xoa thanh cong");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/contacts");
  }
};

// Approve shipper application
exports.approveShipperApplication = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact || contact.type !== "shipper_application") {
      return res.redirect("/admin/contacts");
    }

    // Change user role to shipper and set branch
    if (contact.userId) {
      const user = await User.findById(contact.userId);
      if (user && user.role !== "admin") {
        user.role = "shipper";
        if (contact.branchId) {
          user.branchId = contact.branchId;
        }
        await user.save();
        console.log("[restaurant] User approved as shipper:", user.email, "branch:", contact.branchId);
      }
    }

    contact.status = "approved";
    await contact.save();

    res.redirect(`/admin/contacts/${req.params.id}?success=Da duyet thanh shipper`);
  } catch (error) {
    console.error("[restaurant] Approve shipper error:", error);
    res.redirect("/admin/contacts");
  }
};

// Approve staff application
exports.approveStaffApplication = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact || contact.type !== "staff_application") {
      return res.redirect("/admin/contacts");
    }

    if (contact.userId) {
      const user = await User.findById(contact.userId);
      if (user && user.role !== "admin") {
        user.role = "staff";
        if (contact.branchId) {
          user.branchId = contact.branchId;
        }
        await user.save();
        console.log("[restaurant] User approved as staff:", user.email, "branch:", contact.branchId);
      }
    }

    contact.status = "approved";
    await contact.save();

    res.redirect(`/admin/contacts/${req.params.id}?success=Da duyet thanh nhan vien`);
  } catch (error) {
    console.error("[restaurant] Approve staff error:", error);
    res.redirect("/admin/contacts");
  }
};

// Reject staff application
exports.rejectStaffApplication = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact || contact.type !== "staff_application") {
      return res.redirect("/admin/contacts");
    }

    contact.status = "rejected";
    await contact.save();

    res.redirect(`/admin/contacts/${req.params.id}?success=Da tu choi don dang ky nhan vien`);
  } catch (error) {
    console.error("[restaurant] Reject staff error:", error);
    res.redirect("/admin/contacts");
  }
};

// Reject shipper application
exports.rejectShipperApplication = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact || contact.type !== "shipper_application") {
      return res.redirect("/admin/contacts");
    }

    contact.status = "rejected";
    await contact.save();

    res.redirect(`/admin/contacts/${req.params.id}?success=Da tu choi don dang ky`);
  } catch (error) {
    console.error("[restaurant] Reject shipper error:", error);
    res.redirect("/admin/contacts");
  }
};

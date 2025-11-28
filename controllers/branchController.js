const Branch = require("../models/Branch")
const Dish = require("../models/Dish")
const mongoose = require("mongoose")

// Get all branches
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().populate("dishes").sort({ createdAt: -1 })
    res.render("admin/branches/index", {
      title: "Quản Lý Chi Nhánh",
      branches,
      success: req.query.success,
    })
  } catch (error) {
    console.error(error)
    res.redirect("/admin")
  }
}

// Get new branch form
exports.getNewBranchForm = async (req, res) => {
  try {
    const dishes = await Dish.find().sort({ name: 1 })
    res.render("admin/branches/form", {
      title: "Thêm Chi Nhánh Mới",
      branch: null,
      dishes,
    })
  } catch (error) {
    console.error(error)
    res.redirect("/admin/branches")
  }
}

// Create new branch
exports.createBranch = async (req, res) => {
  try {
    console.log("[restaurant] ========== CREATE BRANCH ==========")
    console.log("[restaurant] Full req.body:", JSON.stringify(req.body, null, 2))

    const { name, address, phone, email, image, totalTables, openingHours, description, dishes } = req.body

    let imagesArray = []
    const rawImages = req.body.images

    console.log("[restaurant] Raw images type:", typeof rawImages)
    console.log("[restaurant] Raw images value:", rawImages)

    if (rawImages) {
      if (Array.isArray(rawImages)) {
        console.log("[restaurant] Processing images array, length:", rawImages.length)
        // Simply filter out empty strings, keep everything else
        imagesArray = rawImages.filter((img) => img && img.trim().length > 0)
      } else if (typeof rawImages === "string" && rawImages.trim().length > 0) {
        console.log("[restaurant] Processing single image string")
        imagesArray = [rawImages.trim()]
      }
    }

    console.log("[restaurant] Final images array:", imagesArray)
    console.log("[restaurant] Final images count:", imagesArray.length)

    const dishesArray = Array.isArray(dishes) ? dishes : dishes ? [dishes] : []

    const branch = new Branch({
      name,
      address,
      phone,
      email: email || undefined,
      image: image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      images: imagesArray,
      totalTables: Number.parseInt(totalTables) || 20,
      availableTables: Number.parseInt(totalTables) || 20,
      openingHours: openingHours || "10:00 - 22:00",
      description: description || "",
      dishes: dishesArray,
    })

    const savedBranch = await branch.save()
    console.log("[restaurant] ✓ Branch saved successfully!")
    console.log("[restaurant] ✓ Images in DB:", savedBranch.images)
    console.log("[restaurant] ✓ Images count:", savedBranch.images.length)

    res.redirect("/admin/branches?success=Thêm chi nhánh thành công")
  } catch (error) {
    console.error("[restaurant] ✗ Error creating branch:", error)
    res.redirect("/admin/branches")
  }
}

// Get edit branch form
exports.getEditBranchForm = async (req, res) => {
  try {
    console.log("[restaurant] Loading edit form for branch ID:", req.params.id)

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error("[restaurant] Invalid branch ID format")
      return res.redirect("/admin/branches?error=ID chi nhánh không hợp lệ")
    }

    const branch = await Branch.findById(req.params.id).populate("dishes")

    if (!branch) {
      console.error("[restaurant] Branch not found")
      return res.redirect("/admin/branches?error=Không tìm thấy chi nhánh")
    }

    console.log("[restaurant] Branch found:", branch.name)
    console.log("[restaurant] Branch images:", branch.images)
    console.log("[restaurant] Branch dishes:", branch.dishes?.length || 0)

    const dishes = await Dish.find().sort({ name: 1 })

    console.log("[restaurant] Total dishes available:", dishes.length)

    res.render("admin/branches/form", {
      title: "Chỉnh Sửa Chi Nhánh",
      branch,
      dishes,
      error: req.query.error || null,
    })
  } catch (error) {
    console.error("[restaurant] Error loading edit form:", error)
    res.redirect("/admin/branches?error=Lỗi khi tải form: " + error.message)
  }
}

// Update branch
exports.updateBranch = async (req, res) => {
  try {
    console.log("[restaurant] ========== UPDATE BRANCH ==========")
    console.log("[restaurant] Branch ID:", req.params.id)
    console.log("[restaurant] Full req.body:", JSON.stringify(req.body, null, 2))

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error("[restaurant] Invalid branch ID format")
      return res.redirect("/admin/branches?error=ID chi nhánh không hợp lệ")
    }

    const currentBranch = await Branch.findById(req.params.id)

    if (!currentBranch) {
      console.error("[restaurant] Branch not found")
      return res.redirect("/admin/branches?error=Không tìm thấy chi nhánh")
    }

    console.log("[restaurant] Current images in DB:", currentBranch.images)
    console.log("[restaurant] Current images count:", currentBranch.images.length)

    const { name, address, phone, email, image, totalTables, availableTables, openingHours, description, dishes } =
      req.body

    if (!name || !address || !phone) {
      console.error("[restaurant] Missing required fields")
      return res.redirect(`/admin/branches/${req.params.id}/edit?error=Vui lòng điền đầy đủ thông tin bắt buộc`)
    }

    let imagesArray = []
    const rawImages = req.body.images

    console.log("[restaurant] Raw images type:", typeof rawImages)
    console.log("[restaurant] Raw images value:", rawImages)

    if (rawImages) {
      if (Array.isArray(rawImages)) {
        console.log("[restaurant] Processing images array, length:", rawImages.length)
        rawImages.forEach((img, idx) => {
          console.log(`[restaurant]   Item ${idx}: "${img}" (length: ${img ? img.length : 0})`)
        })
        imagesArray = rawImages.filter((img) => img && img.trim().length > 0)
      } else if (typeof rawImages === "string" && rawImages.trim().length > 0) {
        console.log("[restaurant] Processing single image string")
        imagesArray = [rawImages.trim()]
      }
    }

    console.log("[restaurant] Final images array:", imagesArray)
    console.log("[restaurant] Final images count:", imagesArray.length)

    const dishesArray = Array.isArray(dishes) ? dishes : dishes ? [dishes] : []

    const updateData = {
      name,
      address,
      phone,
      email: email || undefined,
      image: image || currentBranch.image, // Keep existing image if not provided
      images: imagesArray,
      totalTables: Number.parseInt(totalTables) || currentBranch.totalTables,
      availableTables: Number.parseInt(availableTables) || currentBranch.availableTables,
      openingHours: openingHours || "10:00 - 22:00",
      description: description || "",
      dishes: dishesArray,
    }

    console.log("[restaurant] About to update with images:", updateData.images)

    const updatedBranch = await Branch.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true, // Ensure validators run on update
    })

    console.log("[restaurant] ========== UPDATE COMPLETE ==========")
    console.log("[restaurant] ✓ Branch updated successfully!")
    console.log("[restaurant] ✓ Old images count:", currentBranch.images.length)
    console.log("[restaurant] ✓ New images count:", updatedBranch.images.length)
    console.log("[restaurant] ✓ New images:", updatedBranch.images)

    res.redirect("/admin/branches?success=Cập nhật chi nhánh thành công")
  } catch (error) {
    console.error("[restaurant] ✗ Error updating branch:", error)
    res.redirect(`/admin/branches?error=Lỗi: ${error.message}`)
  }
}

// Delete branch
exports.deleteBranch = async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id)
    res.redirect("/admin/branches?success=Xóa thành công")
  } catch (error) {
    console.error(error)
    res.redirect("/admin/branches")
  }
}

exports.addTable = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)

    if (!branch) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chi nhánh" })
    }

    // Validation: availableTables cannot exceed totalTables (max 20)
    if (branch.availableTables >= branch.totalTables) {
      return res.status(400).json({
        success: false,
        message: `Không thể thêm bàn. Đã đạt tối đa ${branch.totalTables} bàn`,
      })
    }

    branch.availableTables += 1
    await branch.save()

    res.json({
      success: true,
      availableTables: branch.availableTables,
      totalTables: branch.totalTables,
      message: "Đã thêm 1 bàn trống",
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Lỗi khi thêm bàn" })
  }
}

exports.removeTable = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)

    if (!branch) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chi nhánh" })
    }

    // Validation: availableTables cannot be negative
    if (branch.availableTables <= 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể giảm bàn. Đã hết bàn trống",
      })
    }

    branch.availableTables -= 1
    await branch.save()

    res.json({
      success: true,
      availableTables: branch.availableTables,
      totalTables: branch.totalTables,
      message: "Đã giảm 1 bàn trống",
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Lỗi khi giảm bàn" })
  }
}

exports.viewDetail = async (req, res) => {
  try {
    console.log("[restaurant] Loading branch detail for ID:", req.params.id)

    const branch = await Branch.findById(req.params.id).populate("dishes")

    if (!branch) {
      return res.redirect("/branches")
    }

    console.log("[restaurant] Branch loaded - images array:", branch.images)
    console.log("[restaurant] Branch loaded - main image:", branch.image)

    // Get events for this branch
    const Event = require("../models/Event")
    const events = await Event.find({
      $or: [{ isGlobal: true }, { branches: branch._id }],
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    })

    res.render("public/branches/detail", {
      title: branch.name,
      branch,
      events,
      isLoggedIn: req.session.userId ? true : false,
      isAdmin: req.session.role === "admin",
    })
  } catch (error) {
    console.error("[restaurant] Error loading branch detail:", error)
    res.redirect("/branches")
  }
}

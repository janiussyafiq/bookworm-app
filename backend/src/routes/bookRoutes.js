import express, { Router } from 'express';
import Book from '../models/Book.js';
import cloudinary from "../lib/cloudinary.js";
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
    try {
        const { title, caption, image, rating } = req.body;

        if (!title || !caption || !image || !rating) return res.status(400).json({ message: "All fields are required" });

        // upload image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image);
        const imageUrl = uploadResponse.secure_url;

        const newBook = new Book({
            title,
            caption,
            image: imageUrl,
            rating,
            user: req.user._id,
        });

        await newBook.save();

        res.status(201).json(newBook);

    } catch (error) {
        console.log("Error creating book:", error);
        res.status(500).json({ message: error.message });
    }
}
);

router.get("/", protectRoute, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // implement infinite scroll
        const books = await Book.find()
            .sort({ createdAt: -1 }) // desc
            .skip(skip)
            .limit(limit)
            .populate("user", "username profileImage");

        const totalBooks = await Book.countDocuments();

        res.send({
            books,
            currentPage: page,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
        });
    } catch (error) {
        console.log("Error fetching books:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
);

router.delete("/:id", protectRoute, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) return res.status(404).json({ message: "Book not found" });

        // check if the user is the owner of the book
        if (book.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // delete image from cloudinary
        if (book.image && book.image.includes("cloudinary")) {
            try {
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                console.log("Error deleting image from cloudinary:", error);
                return res.status(500).json({ message: "Error deleting image from cloudinary" });

            }
        }

        await book.deleteOne();
        await Book.findByIdAndDelete(req.params.id); // unnecessary, but for safety
        res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
        console.log("Error deleting book:", error);
        res.status(500).json({ message: error.message });
    }
}
);

// get recommended books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
    try {
        const books = await Book.find({ user: req.params.id })
            .sort({ createdAt: -1 }); // desc

        res.status(200).json({ books });
    } catch (error) {
        console.log("Error fetching books:", error);
        res.status(500).json({ message: error.message });
    }
}
);

export default router;
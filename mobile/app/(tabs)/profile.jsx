import { View, Alert, Text, FlatList, TouchableOpacity } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import { Image } from 'expo-image';
import { formatPublishDate } from '../../lib/utils';
import ProfileHeader from '../../components/ProfileHeader';
import LogoutButton from '../../components/LogoutButton';
import styles from "../../assets/styles/profile.styles";

import COLORS from '../../constants/colors';


export default function Profile() {

    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { token } = useAuthStore();

    const router = useRouter();

    const fetchData = async () => {
        try {
            setIsLoading(true);

            const response = await fetch(`${API_URL}/api/books/user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Something went wrong");

            setBooks(data.books);
            console.log("Books:", data.books);
        } catch (error) {
            console.error("Error fetching books:", error);
            Alert.alert("Error", "Failed to load profile data. Pull down to refresh.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteBook = async (bookId) => {
        try {
            const response = await fetch(`${API_URL}/api/books/${bookId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Something went wrong");
            setBooks((prevBooks) => prevBooks.filter((book) => book._id !== bookId));
            Alert.alert("Success", "Book recommendation deleted successfully.");
        } catch (error) {
            console.error("Error deleting book:", error);
            Alert.alert("Error", "Failed to delete book recommendation.");
        }
    };

    const confirmDelete = (bookId) => {
        Alert.alert(
            "Delete Recommendation",
            "Are you sure you want to delete this recommendation?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => handleDeleteBook(bookId),
                    style: "destructive",
                },
            ],
            { cancelable: true }
        );
    };

    const renderBookItem = ({ item }) => (
        <View style={styles.bookItem}>
            <Image
                source={item.image}
                style={styles.bookImage}
            />
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
                <Text style={styles.bookCaption} numberOfLines={2}>{item.caption}</Text>
                <Text style={styles.bookDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDelete(item._id)}
            >
                <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>

        </View>
    );

    const renderRatingStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? "star" : "star-outline"}
                    size={14}
                    color={i <= rating ? "#f4b400" : COLORS.textSecondary}
                    style={{ marginRight: 2 }}
                />
            );
        }
        return stars;
    };

    return (
        <View style={styles.container}>
            <ProfileHeader />
            <LogoutButton />

            { /* Your recommendations */}
            <View style={styles.booksHeader}>
                <Text style={styles.booksTitle}>Your Recommendations</Text>
                <Text style={styles.booksCount}>{books?.length || 0} books</Text>
            </View>

            <FlatList
                data={books}
                renderItem={renderBookItem}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.booksList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="book-outline" size={50} color={COLORS.textSecondary} />
                        <Text style={styles.emptyText}>No recommendations yet.</Text>
                        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
                            <Text style={styles.addButtonText}>Your First Book</Text>
                        </TouchableOpacity>
                    </View>
                }
            // onRefresh={fetchData}
            // refreshing={isLoading}
            // onEndReachedThreshold={0.5}
            // onEndReached={() => {
            //     if (!isLoading) {
            //         fetchData();
            //     }
            // }}

            // style={styles.booksList}
            >

            </FlatList>
        </View>
    )
}
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Layout,
    Typography,
    Button,
    Card,
    Divider,
    Space,
    List,
    Input,
    Rate,
} from "antd";
import {
    UserOutlined,
    CalendarOutlined,
    ArrowLeftOutlined,
} from "@ant-design/icons";

// import รูปจาก src/assets
import defaultModImage from "../../assets/header.jpg";
import { getMod, listComments, createComment, listModRatings, createModRating } from "../../services/workshop";
import type { Mod, Comment } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Content, Header } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ModDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { id: userId } = useAuth();

    const [mod, setMod] = useState<Mod | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [rating, setRating] = useState<number>(0);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [ratingCount, setRatingCount] = useState<number>(0);

    useEffect(() => {
        if (id) {
            const modId = Number(id);
            getMod(modId).then(setMod).catch(console.error);
            listComments(modId).then(setComments).catch(console.error);
            listModRatings(modId)
                .then((rs) => {
                    if (rs.length > 0) {
                        const sum = rs.reduce((s, r) => s + r.rating, 0);
                        setAverageRating(sum / rs.length);
                        setRatingCount(rs.length);
                    }
                })
                .catch(console.error);
        }
    }, [id]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !mod || !userId) return;
        const payload = {
            content: newComment,
            user_id: userId,
            thread_id: mod.ID,
        };
        try {
            const c = await createComment(payload);
            setComments([c, ...comments]);
            setNewComment("");
        } catch (e) {
            console.error(e);
        }
    };

    const handleRateChange = async (value: number) => {
        if (!mod || !userId) return;
        setRating(value);
        try {
            await createModRating({ rating: value, user_id: userId, mod_id: mod.ID });
            const ratings = await listModRatings(mod.ID);
            if (ratings.length > 0) {
                const sum = ratings.reduce((s, r) => s + r.rating, 0);
                setAverageRating(sum / ratings.length);
                setRatingCount(ratings.length);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!mod) {
        return (
            <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
                <Content style={{ padding: "20px", color: "white" }}>
                    <Title level={3} style={{ color: "white" }}>
                        ❌ Mod not found
                    </Title>
                    <Button
                        type="primary"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
            {/* Banner */}
            <Header
                style={{
                    background: "#1f1f1f",
                    padding: 0,
                    height: 250,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <img
                    src={defaultModImage}
                    alt={mod.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </Header>

            {/* Main Content */}
            <Content style={{ padding: "20px" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                    {/* Left: Details */}
                    <div style={{ flex: 3 }}>
                        <Title level={2} style={{ color: "white" }}>
                            {mod.title}
                        </Title>
                        <Space>
                            <Button type="primary" href={mod.file_path} target="_blank">
                                Download
                            </Button>
                            <Button onClick={() => navigate(`/workshop/upload?gameId=${mod.game_id}&modId=${mod.ID}`)}>
                                Edit
                            </Button>
                        </Space>

                        <Divider style={{ borderColor: "#333" }} />

                        <Paragraph style={{ color: "white" }}>
                            {mod.description ||
                                "This is a placeholder description for the mod. In the future, you can load real mod details from the backend."}
                        </Paragraph>

                        {/* Comments Section */}
                        <Divider style={{ borderColor: "#333" }} />
                        <Title level={4} style={{ color: "white" }}>
                            Comments
                        </Title>

                        <TextArea
                            rows={3}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            style={{ marginBottom: "10px" }}
                        />
                        <Button type="primary" onClick={handleAddComment}>
                            Add Comment
                        </Button>

                        <List
                            dataSource={comments}
                            style={{ marginTop: 20 }}
                            renderItem={(item) => (
                                <List.Item style={{ borderBottom: "1px solid #333" }}>
                                    <Card
                                        style={{
                                            width: "100%",
                                            background: "#1f1f1f",
                                            color: "white",
                                        }}
                                        bodyStyle={{ padding: "10px" }}
                                    >
                                        <Text strong style={{ color: "#4dabf7" }}>
                                            {item.user?.username || "Anonymous"}
                                        </Text>
                                        <Paragraph style={{ color: "white", margin: "5px 0" }}>
                                            {item.content}
                                        </Paragraph>
                                    </Card>
                                </List.Item>
                            )}
                        />
                    </div>

                    {/* Right: Sidebar */}
                    <div style={{ flex: 1 }}>
                        <Card
                            style={{
                                background: 'linear-gradient(90deg, #9254de 0%, #f759ab 100%)',
                                color: "white",
                                borderRadius: 8,
                            }}
                        >
                            <Title level={5} style={{ color: "white" }}>
                                <UserOutlined /> Mod ID: {mod.ID}
                            </Title>
                            <Title level={5} style={{ color: "white" }}>
                                <CalendarOutlined /> Uploaded: {mod.upload_date}
                            </Title>

                            <Divider style={{ borderColor: "#333" }} />

                            {/* Stats */}
                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#4dabf7" }}>
                                    {ratingCount}
                                </Text>{" "}
                                <Text style={{ color: "white" }}>Ratings</Text>
                            </div>

                            <Divider style={{ borderColor: "#D" }} />

                            {/* ⭐ Rating Section */}
                            <div style={{ marginBottom: "10px" }}>
                                <Title level={5} style={{ color: "white", marginBottom: 5 }}>
                                    Rate this Mod
                                </Title>
                                <Rate value={rating} onChange={handleRateChange} />
                                <div style={{ marginTop: 5 }}>
                                    <Text style={{ color: "white" }}>
                                        {rating > 0 ? `Your Rating: ${rating} / 5` : "No rating yet"}
                                    </Text>
                                </div>

                                <Divider style={{ borderColor: "#333" }} />

                                <Text style={{ color: "white" }}>Average Rating:</Text>
                                <div>
                                    <Rate disabled allowHalf value={averageRating} />
                                    <Text style={{ color: "white", marginLeft: 8 }}>
                                        {averageRating.toFixed(1)} / 5 ({ratingCount.toLocaleString()} ratings)
                                    </Text>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

export default ModDetail;

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
    DownloadOutlined,
    ShareAltOutlined,
    ArrowLeftOutlined,
} from "@ant-design/icons";

// import รูปจาก src/assets
import defaultModImage from "../../assets/header.jpg";

const { Content, Header } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ModItem {
    id: number;
    title: string;
    author?: string;
    image?: string;
    description?: string;
    date?: string;
    downloads?: number;
    views?: number;
    subscribers?: number;
}

interface CommentItem {
    author: string;
    content: string;
    datetime: string;
}

const ModDetail: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams<{ title: string }>();
    const initial = location.state as ModItem | undefined;
    const [mod, setMod] = useState<ModItem | undefined>(initial);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [newComment, setNewComment] = useState("");
    const [rating, setRating] = useState<number>(0);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [ratingCount, setRatingCount] = useState<number>(0);

    useEffect(() => {
        const id = params.title || mod?.id?.toString();
        if (!id) return;
        const fetchData = async () => {
            try {
                const [modRes, ratingRes] = await Promise.all([
                    fetch(`http://localhost:8088/mods/${id}`),
                    fetch(`http://localhost:8088/modratings`),
                ]);

                const modData: any = await modRes.json();
                setMod({
                    id: modData.ID,
                    title: modData.title,
                    description: modData.description,
                    date: modData.upload_date,
                });

                const ratings: any[] = await ratingRes.json();
                const related = ratings.filter((r) => r.mod_id === Number(id));
                setComments(
                    related.map((r) => ({
                        author: `User ${r.user_game_id}`,
                        content: r.review,
                        datetime: r.CreatedAt || "",
                    }))
                );
                const nums = related
                    .map((r) => parseFloat(r.rating))
                    .filter((n) => !isNaN(n));
                const count = nums.length;
                const avg = count ? nums.reduce((a, b) => a + b, 0) / count : 0;
                setAverageRating(avg);
                setRatingCount(count);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [params.title]);

    const handleAddComment = async () => {
        if (!mod || !newComment.trim()) return;

        try {
            await fetch(`http://localhost:8088/modratings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating: rating.toString(),
                    review: newComment,
                    user_game_id: 1,
                    mod_id: mod.id,
                }),
            });
        } catch (err) {
            console.error(err);
        }

        const newItem: CommentItem = {
            author: "You",
            content: newComment,
            datetime: new Date().toLocaleString(),
        };

        const newCount = ratingCount + 1;
        const newAvg = (averageRating * ratingCount + rating) / newCount;
        setRatingCount(newCount);
        setAverageRating(newAvg);

        setComments([newItem, ...comments]);
        setNewComment("");
    };

    const handleRateChange = (value: number) => {
        setRating(value);
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
                    src={mod.image || defaultModImage}
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
                            <Button type="primary">Download</Button>
                            
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
                                            {item.author}
                                        </Text>
                                        <Paragraph style={{ color: "white", margin: "5px 0" }}>
                                            {item.content}
                                        </Paragraph>
                                        <Text type="secondary" style={{ color: "#D3D3D3", fontSize: "12px" }}>
                                            {item.datetime}
                                        </Text>
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
                                <UserOutlined /> Creator: {mod.author}
                            </Title>
                            <Title level={5} style={{ color: "white" }}>
                                <CalendarOutlined /> Uploaded: {mod.date || "2025-09-05"}
                            </Title>

                            <Divider style={{ borderColor: "#333" }} />

                            {/* Stats */}
                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#4dabf7" }}>
                                    {mod.views?.toLocaleString() || 0}
                                </Text>{" "}
                                <Text style={{ color: "white" }}>Unique Visitors</Text>
                                <br />
                                <Text strong style={{ color: "#4dabf7" }}>
                                    {mod.subscribers?.toLocaleString() || 0}
                                </Text>{" "}
                                <Text style={{ color: "white" }}>Current Downloads</Text>
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

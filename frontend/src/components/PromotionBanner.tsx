import { Carousel } from "antd";
import type { Promotion } from "../interfaces/Promotion";

const base_url = import.meta.env.VITE_API_URL || "http://localhost:8088";

const resolveImgUrl = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("blob:")) return "";
  if (src.startsWith("data:image/")) return src;
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  const clean = src.startsWith("/") ? src.slice(1) : src;
  return `${base_url}/${clean}`;
};

interface PromotionBannerProps {
  promotions: Promotion[];
  onClick: (id: number) => void;
}

const PromotionBanner = ({ promotions, onClick }: PromotionBannerProps) => {
  const promotionsWithImages = promotions.filter((promo) => promo.promo_image);

  if (promotionsWithImages.length === 0) return null;

  if (promotionsWithImages.length > 1) {
    return (
      <Carousel autoplay style={{ marginBottom: 24 }}>
        {promotionsWithImages.map((promo) => (
          <div
            key={promo.ID}
            onClick={() => onClick(promo.ID)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={resolveImgUrl(promo.promo_image)}
              alt={promo.title}
              style={{
                height: 180,
                width: "100%",
                objectFit: "cover",
                borderRadius: 10,
              }}
            />
          </div>
        ))}
      </Carousel>
    );
  }

  const promo = promotionsWithImages[0];
  return (
    <div
      onClick={() => onClick(promo.ID)}
      style={{ cursor: "pointer", marginBottom: 24 }}
    >
      <img
        src={resolveImgUrl(promo.promo_image)}
        alt={promo.title}
        style={{
          height: 180,
          width: "100%",
          objectFit: "cover",
          borderRadius: 10,
        }}
      />
    </div>
  );
};

export default PromotionBanner;

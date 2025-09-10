import React from "react";
import ReviewSection from "../../components/ReviewSection";
import { useParams } from "react-router-dom";

const DevReviewsStandalone: React.FC = () => {
  const { gameId } = useParams();
  const gid = Number(gameId || 0);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">DEV: Reviews for Game #{gid}</h1>
      <ReviewSection gameId={gid} />
    </div>
  );
};

export default DevReviewsStandalone;

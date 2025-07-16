import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const MainBanner = () => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    const fetchAds = async () => {
      const snapshot = await getDocs(collection(db, "ads"));
      const today = new Date();
      const activeAds = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(ad =>
          ad.type === "banner" &&
          ad.startDate?.toDate() <= today &&
          ad.endDate?.toDate() >= today
        );

      // 노출수 업데이트
      activeAds.forEach(async (ad) => {
        const adRef = doc(db, "ads", ad.id);
        await updateDoc(adRef, {
          views: (ad.views || 0) + 1,
        });
      });

      setAds(activeAds);
    };
    fetchAds();
  }, []);

  const handleClick = async (ad) => {
    const adRef = doc(db, "ads", ad.id);
    await updateDoc(adRef, {
      clicks: (ad.clicks || 0) + 1,
    });
    window.open(ad.linkUrl, "_blank");
  };

  return (
    <div className="flex gap-3 overflow-x-auto py-4">
      {ads.map((ad) => (
        <img
          key={ad.id}
          src={ad.imageUrl}
          alt={ad.brandName}
          className="w-64 h-32 object-cover cursor-pointer rounded"
          onClick={() => handleClick(ad)}
        />
      ))}
    </div>
  );
};

export default MainBanner; 
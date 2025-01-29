import { useEffect, useRef } from "react";
import useRoomRateAvailabilityCalendar from "../(hooks)/useRoomRateAvailabilityCalendar";

interface IProps {
  property_id: number;
  start_date: string;
  end_date: string;
}

export default function RoomRateCalendar({ property_id, start_date, end_date }: IProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRoomRateAvailabilityCalendar({ property_id, start_date, end_date });

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    if (lastElementRef.current) {
      observer.current.observe(lastElementRef.current);
    }

    return () => {
      if (observer.current && lastElementRef.current) {
        observer.current.unobserve(lastElementRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div>
        
      {data?.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
            
          {
          // @ts-expect-error: I know this is okay
          page.data.room_categories.map((room) => (
            <div key={room.id} className="border p-3 mb-2">
              <h3 className="font-bold">{room.name}</h3>
              <p>Occupancy: {room.occupancy}</p>
            </div>
          ))}
        </div>
      ))}

      {hasNextPage && (
        <div ref={lastElementRef} className="text-center p-4">
          Loading more...
        </div>
      )}
    </div>
  );
}

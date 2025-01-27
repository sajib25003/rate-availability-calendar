// Import necessary modules and types
import Fetch from "@/utils/Fetch";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Dayjs } from "dayjs";

// Define interfaces for the data structures used in the calendar
export interface IRoomInventory {
  id: string;
  date: Dayjs;
  available: number;
  status: boolean;
  booked: number;
}

export interface IRoomRatePlans {
  id: number;
  name: string;
}

export interface IRateCalendar {
  id: string;
  date: Dayjs;
  rate: number;
  min_length_of_stay: number;
  reservation_deadline: number;
}

export interface IRatePlanCalendar extends IRoomRatePlans {
  calendar: Array<IRateCalendar>;
}

export interface IRoomCategory {
  id: string;
  name: string;
  occupancy: number;
}

export interface IRoomCategoryCalender extends IRoomCategory {
  inventory_calendar: Array<IRoomInventory>;
  rate_plans: Array<IRatePlanCalendar>;
}

// Define the parameters and response interfaces for the hook
interface IParams {
  property_id: number;
  start_date: string;
  end_date: string;
}

interface IResponse {
  room_categories: Array<IRoomCategoryCalender>;
  nextCursor?: number; // available if you pass a cursor as query param
}

// Define the IResult interface
interface IResult<T> {
  data: T;
  message: string;
  status: string;
}

// Custom hook to fetch room rate availability calendar data
export default function useRoomRateAvailabilityCalendar(params: IParams) {
  // Fetch function for rate calendar
  const fetchRateCalendar = async ({ pageParam = "0" }) => {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/property/${params.property_id}/rate-calendar/assessment`
    );

    url.search = new URLSearchParams({
      start_date: params.start_date,
      end_date: params.end_date,
      cursor: pageParam, // Cursor for pagination
    }).toString();

    // Fetch and directly return IResponse wrapped in IResult
    const response = await Fetch<IResult<IResponse>>({
      method: "GET",
      url,
    });

    return response; // Matches the expected structure of IResult<IResponse>
  };

  // Infinite query using useInfiniteQuery
  return useInfiniteQuery({
    queryKey: ["property_room_calendar", params], // Unique query key
    queryFn: fetchRateCalendar, // Fetch function
    getNextPageParam: (lastPage) => {
      // Access nextCursor from lastPage.data
      console.log(lastPage, "last page nextCursor");
      return lastPage.data.nextCursor || null;
    },
    initialPageParam: "0", // Set the initial cursor value
  });
}



"use client";

// Import necessary modules and components
import {
  Grid2 as Grid,
  Typography,
  Card,
  Box,
  Container,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DateRange } from "@mui/x-date-pickers-pro";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField";
import { Controller, useForm } from "react-hook-form";
import {
  RefObject,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  VariableSizeList,
  ListChildComponentProps,
  areEqual,
  FixedSizeGrid,
  GridChildComponentProps,
  VariableSizeGrid,
  GridOnScrollProps,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { countDaysByMonth } from "@/utils";
import RoomRateAvailabilityCalendar from "./(components)/RoomCalendar";
import Navbar from "@/components/Navbar";
import useRoomRateAvailabilityCalendar from "./(hooks)/useRoomRateAvailabilityCalendar";
import { debounce } from "lodash";

// Define the form type for the date range picker
export type CalendarForm = {
  date_range: DateRange<dayjs.Dayjs>;
};

// Style the VariableSizeList to hide the scrollbar
const StyledVariableSizeList = styled(VariableSizeList)({
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": {
    display: "none",
  },
});

export default function Page() {
  const theme = useTheme(); // Get the theme for styling

  const propertyId = 1; // Example property ID

  // Refs for various elements to handle scrolling
  const rootContainerRef = useRef<HTMLDivElement>(null);
  const calenderMonthsRef = useRef<VariableSizeList | null>(null);
  const calenderDatesRef = useRef<FixedSizeGrid | null>(null);
  const mainGridContainerRef = useRef<HTMLDivElement | null>(null);
  const InventoryRefs = useRef<Array<RefObject<VariableSizeGrid>>>([]);

  // Handle horizontal scroll for dates
  const handleDatesScroll = useCallback(({ scrollLeft }: GridOnScrollProps) => {
    InventoryRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current.scrollTo({ scrollLeft });
      }
    });
    if (calenderMonthsRef.current) {
      calenderMonthsRef.current.scrollTo(scrollLeft);
    }
  }, []);

  // Handle horizontal scroll for the entire calendar
  // const handleCalenderScroll = useCallback(
  //   ({ scrollLeft }: GridOnScrollProps) => {
  //     InventoryRefs.current.forEach((ref) => {
  //       if (ref.current) {
  //         ref.current.scrollTo({ scrollLeft });
  //       }
  //     });
  //     if (calenderMonthsRef.current) {
  //       calenderMonthsRef.current.scrollTo(scrollLeft);
  //     }
  //     if (calenderDatesRef.current) {
  //       calenderDatesRef.current.scrollTo({ scrollLeft });
  //     }
  //   },
  //   []
  // );
  const handleCalenderScroll = useCallback(
  debounce(({ scrollLeft }: GridOnScrollProps) => {
    InventoryRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current.scrollTo({ scrollLeft });
      }
    });
    if (calenderMonthsRef.current) {
      calenderMonthsRef.current.scrollTo(scrollLeft);
    }
    if (calenderDatesRef.current) {
      calenderDatesRef.current.scrollTo({ scrollLeft });
    }
  }, 200), // Adjust debounce delay as needed (in ms)
  []
);

  // Add event listener for wheel scroll to handle horizontal scrolling
  useEffect(() => {
    const { current: rootContainer } = rootContainerRef;
    if (rootContainer) {
      const handler = (e: WheelEvent) => {
        if (
          mainGridContainerRef.current &&
          InventoryRefs.current &&
          calenderMonthsRef.current &&
          calenderDatesRef.current
        ) {
          // Check if deltaX is non-zero (indicating horizontal scroll)
          if (e.deltaX !== 0) {
            e.preventDefault();
            let { scrollLeft } = mainGridContainerRef.current;
            scrollLeft += e.deltaX;

            InventoryRefs.current.forEach((ref) => {
              if (ref.current) {
                ref.current.scrollTo({ scrollLeft });
              }
            });

            calenderMonthsRef.current.scrollTo(scrollLeft);
            calenderDatesRef.current.scrollTo({ scrollLeft });
          }
        }
      };
      rootContainer.addEventListener("wheel", handler);
      return () => rootContainer.removeEventListener("wheel", handler);
    }
  });

  // State for calendar dates and months
  const [calenderDates, setCalenderDates] = useState<Array<dayjs.Dayjs>>([]);
  const [calenderMonths, setCalenderMonths] = useState<Array<[string, number]>>(
    []
  );

  // Form control for date range picker
  const { control, watch } = useForm<CalendarForm>({
    defaultValues: {
      date_range: [dayjs(), dayjs().add(4, "month")],
    },
  });
  const watchedDateRange = watch("date_range");

  // Update calendar dates and months when the date range changes
  useEffect(() => {
    const { months, dates } = countDaysByMonth(
      watchedDateRange[0]!,
      watchedDateRange[1]
        ? watchedDateRange[1]
        : watchedDateRange[0]!.add(2, "month")
    );

    setCalenderMonths(months);
    setCalenderDates(dates);
  }, [watchedDateRange]);

  // Fetch room rate availability calendar data
  const room_calendar = useRoomRateAvailabilityCalendar({
    property_id: propertyId,
    start_date: watchedDateRange[0]!.format("YYYY-MM-DD"),
    end_date: (watchedDateRange[1]
      ? watchedDateRange[1]
      : watchedDateRange[0]!.add(2, "month")
    ).format("YYYY-MM-DD"),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRoomRateAvailabilityCalendar({
      property_id: propertyId,
      start_date: watchedDateRange[0]!.format("YYYY-MM-DD"),
      end_date: (watchedDateRange[1]
        ? watchedDateRange[1]
        : watchedDateRange[0]!.add(2, "month")
      ).format("YYYY-MM-DD"),
    });
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        // console.log("Observer Triggered:", entries[0]);
        if (entries[0].isIntersecting) {
          // console.log("Fetching next page...");
          fetchNextPage();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    if (lastElementRef.current) {
      observer.current.observe(lastElementRef.current);
      // console.log("Observer attached to:", lastElementRef.current); // Debugging line
    }

    return () => {
      if (observer.current && lastElementRef.current) {
        observer.current.unobserve(lastElementRef.current);
        // console.log("Observer detached from:", lastElementRef.current); // Debugging line
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // console.log("data", data);

  // console.log(room_calendar, "room calendar");

  // Component to render each month row in the calendar
  const MonthRow: React.FC<ListChildComponentProps> = memo(function MonthRowFC({
    index,
    style,
  }) {
    const month = calenderMonths[index][0];

    return (
      <Box style={style}>
        <Box
          sx={{
            px: 1,
            fontSize: "12px",
            fontWeight: "bold",
            borderLeft: "1px solid",
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <Box
            component="span"
            sx={{
              position: "sticky",
              left: 2,
              zIndex: 1,
            }}
          >
            {month}
          </Box>
        </Box>
      </Box>
    );
  },
  areEqual);

  // Component to render each date row in the calendar
  const DateRow: React.FC<GridChildComponentProps> = memo(function DateRowFC({
    columnIndex,
    style,
  }) {
    return (
      <Box style={style}>
        <Box
          sx={{
            pr: 1,
            fontSize: "12px",
            textAlign: "right",
            fontWeight: "bold",
            borderLeft: "1px solid",
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <Box>{calenderDates[columnIndex].format("ddd")}</Box>
          <Box>{calenderDates[columnIndex].format("DD")}</Box>
        </Box>
      </Box>
    );
  },
  areEqual);

  return (
    <Container sx={{ backgroundColor: "#EEF2F6", overflowY: "auto", height: "100vh" }}>
      <Navbar />
      <Box>
        <Card elevation={1} sx={{ padding: 4, mt: 4 }}>
          <Grid container columnSpacing={2}>
            <Grid size={12}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  mb: 0,
                }}
              >
                Rate Calendar
              </Typography>
            </Grid>

            <Grid size={4}>
              <Controller
                name="date_range"
                control={control}
                rules={{
                  required: "Please specify a date range.",
                }}
                render={({ field, fieldState: { invalid, error } }) => (
                  <DateRangePicker
                    {...field}
                    autoFocus
                    minDate={dayjs()}
                    maxDate={dayjs().add(2, "year")}
                    slots={{ field: SingleInputDateRangeField }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: invalid,
                        helperText: invalid ? error?.message : null,
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Card>
        <Card elevation={1} sx={{ my: 6, padding: 3 }} ref={rootContainerRef}>
          <Grid container columnSpacing={2}>
            <Grid
              size={{
                xs: 4,
                sm: 4,
                md: 3,
                lg: 2,
                xl: 2,
              }}
            ></Grid>

            <Grid
              size={{
                xs: 8,
                sm: 8,
                md: 9,
                lg: 10,
                xl: 10,
              }}
            >
              <AutoSizer disableHeight>
                {({ width }) => (
                  <StyledVariableSizeList
                    height={19}
                    width={width}
                    itemCount={calenderMonths.length}
                    itemSize={(index: number) => {
                      const no_of_days = calenderMonths[index][1];
                      return no_of_days * 74;
                    }}
                    layout="horizontal"
                    ref={calenderMonthsRef}
                  >
                    {MonthRow}
                  </StyledVariableSizeList>
                )}
              </AutoSizer>
            </Grid>
          </Grid>

          <Grid container sx={{ height: 48 }}>
            <Grid
              sx={{
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
              }}
              size={{
                xs: 4,
                sm: 4,
                md: 3,
                lg: 2,
                xl: 2,
              }}
            ></Grid>
            <Grid
              size={{
                xs: 8,
                sm: 8,
                md: 9,
                lg: 10,
                xl: 10,
              }}
            >
              <AutoSizer>
                {({ height, width }) => (
                  <FixedSizeGrid
                    height={height}
                    width={width}
                    columnCount={calenderDates.length}
                    columnWidth={74}
                    rowCount={1}
                    rowHeight={37}
                    ref={calenderDatesRef}
                    outerRef={mainGridContainerRef}
                    onScroll={handleDatesScroll}
                  >
                    {DateRow}
                  </FixedSizeGrid>
                )}
              </AutoSizer>
            </Grid>
          </Grid>
          {data?.pages.map((page, pageIndex) =>
          // @ts-expect-error: I know this is okay
          page.data.room_categories.map((room, roomIndex) => {
            const isLastItem =
              pageIndex === data.pages.length - 1 &&
              // @ts-expect-error: I know this is okay
              roomIndex === page.data.room_categories.length - 1;

            return (
              <div
                key={room.id}
                className="border p-3 mb-2"
                ref={isLastItem ? lastElementRef : null} // Attach ref only to last item
              >
                <RoomRateAvailabilityCalendar
                    index={roomIndex}
                    InventoryRefs={InventoryRefs}
                    isLastElement={
                      isLastItem
                    }
                    room_category={room}
                    handleCalenderScroll={handleCalenderScroll}
                  />
              </div>
            );
          })
        )}

          {/* {room_calendar.isSuccess
            ? room_calendar.data.pages.map((page, pageIndex) =>
                page.data.room_categories.map((room_category, roomIndex) => (
                  <RoomRateAvailabilityCalendar
                    key={`${pageIndex}-${roomIndex}`}
                    index={roomIndex}
                    InventoryRefs={InventoryRefs}
                    isLastElement={
                      pageIndex === room_calendar.data.pages.length - 1 &&
                      roomIndex === page.data.room_categories.length - 1
                    }
                    room_category={room_category}
                    handleCalenderScroll={handleCalenderScroll}
                  />
                ))
              )
            : null} */}

          {room_calendar.isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Card>
      </Box>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          textAlign: "center",
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Grit System. All rights reserved.
        </Typography>
      </Box>
      
    </Container>
  );
}

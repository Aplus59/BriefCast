import { Card, CardContent, Typography } from '@mui/material';

// Skeleton cho Topic Card (Topics Section)
export const SkeletonTopicCard = () => (
  <div className="flex flex-col items-center py-4 rounded-md bg-gray-100 animate-pulse">
    <div className="h-6 w-24 bg-gray-300 rounded mb-4"></div>
    <div className="h-[20vh] w-[25vh] bg-gray-300 rounded-md"></div>
  </div>
);

// Skeleton cho News Card (Latest News Section)
export const SkeletonNewsCard = ({ isBig = false }) => (
  <div className={`animate-pulse ${isBig ? 'flex items-center gap-4' : 'flex flex-col'} rounded-lg shadow bg-gray-100`}>
    <Card className="flex items-center gap-4 w-full">
      <div
        className={`${
          isBig ? 'w-[26vh] h-[25vh]' : 'w-full md:h-[20vh] xl:h-[25vh]'
        } bg-gray-300 rounded-lg`}
      ></div>
      {isBig && (
        <CardContent className="p-0 w-full">
          <Typography variant="h6" className="h-6 bg-gray-300 rounded mb-2 w-3/4"></Typography>
          <ul className="list-disc pl-5 space-y-2">
            <li><div className="h-4 bg-gray-300 rounded w-full"></div></li>
            <li><div className="h-4 bg-gray-300 rounded w-5/6"></div></li>
          </ul>
        </CardContent>
      )}
      {!isBig && (
        <div className="p-2">
          <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        </div>
      )}
    </Card>
  </div>
);
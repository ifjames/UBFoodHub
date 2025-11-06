import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    const formattedTitle = title ? `${title} | UBFoodHub` : "UBFoodHub";
    document.title = formattedTitle;

    return () => {
      document.title = "UBFoodHub";
    };
  }, [title]);
}

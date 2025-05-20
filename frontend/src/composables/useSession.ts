export const useSession = () => {
  const isAuthenticated = async () => {
    const data = await fetch("api/session/", {
      credentials: "same-origin",
    });
    if (!data.ok) {
      throw new Error("Failed to fetch session data");
    }
    const session = await data.json();
    return session.isAuthenticated;
  };
  return { isAuthenticated };
};

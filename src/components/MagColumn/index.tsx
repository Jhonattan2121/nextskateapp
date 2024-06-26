import AuthorSearchBar from "@/app/upload/components/searchBar";
import { useHiveUser } from "@/contexts/UserContext";
import usePosts from "@/hooks/usePosts";
import PostModel from "@/lib/models/post";
import { Box, Button, ButtonGroup, Flex, Grid, HStack } from "@chakra-ui/react";
import { useCallback, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { BeatLoader } from "react-spinners";
import LoginModal from "../Hive/Login/LoginModal";
import Post from "../PostCard";
import PostSkeleton from "../PostCard/Skeleton";
const SKATEHIVE_TAG = [{ tag: "hive-173115", limit: 30 }];

interface PostFeedProps {
  posts: any[];  // Use a more specific type based on your application
  visiblePosts: number;
  setVisiblePosts: (count: number) => void;
  query: string;
}

const PostFeed: React.FC<PostFeedProps> = ({ posts, visiblePosts, setVisiblePosts, query }) => {


  return (
    <Box overflow={'auto'}>
      <InfiniteScroll
        dataLength={visiblePosts}
        next={() => {
          setVisiblePosts(visiblePosts + 2);
        }}
        hasMore={visiblePosts < posts.length}
        loader={<Flex justify="center"><BeatLoader size={8} color="darkgrey" /></Flex>}
        style={{ overflow: "hidden" }}
      >
        <Grid templateColumns="repeat(1, 1fr)" gap={0}>
          {posts.length > 0 &&
            posts.slice(0, visiblePosts).map((post, i) => (
              <Post key={`${query}-${post.url}`} postData={PostModel.newFromDiscussion(post)} />
            ))}
        </Grid>
      </InfiniteScroll>
    </Box>

  );
};

interface NavigationButtonsProps {
  updateFeed: (query: string, tagParams: any[]) => void;
  feedConfig: { query: string; tag: any[] };
  hiveUser: any;  // Use the appropriate type for hiveUser
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({ updateFeed, feedConfig, hiveUser }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleCreateClick = () => {
    if (!hiveUser.hiveUser) {
      setIsLoginModalOpen(true)
    } else {
      window.location.href = "/upload"
    }
  }

  return (
    <>
      {isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />}
      <HStack justifyContent="center" margin="12px">
        <ButtonGroup size="sm" isAttached variant="outline" colorScheme="green">
          <Button onClick={() => updateFeed("trending", SKATEHIVE_TAG)} isActive={feedConfig.query === "trending"}>
            Trending
          </Button>
          <Button onClick={() => updateFeed("created", SKATEHIVE_TAG)} isActive={feedConfig.query === "created"}>
            Most Recent
          </Button>
          {hiveUser.hiveUser && (
            <Button onClick={() => updateFeed("feed", [{ tag: hiveUser.hiveUser.name, limit: 100 }])} isActive={feedConfig.query === "feed"}>
              My Crew
            </Button>
          )}
        </ButtonGroup>
        <Button
          size={"sm"}
          onClick={handleCreateClick}
          colorScheme="green"
          variant={"outline"}
        >
          + Create 🛹
        </Button>
      </HStack>
    </>
  );
};

export default function MagColumn() {

  const SKATEHIVE_TAG = useMemo(() => [{ tag: "hive-173115", limit: 30 }], []);
  const [feedConfig, setFeedConfig] = useState({ tag: SKATEHIVE_TAG, query: "created" });
  const { posts, error, isLoading, setQueryCategory, setDiscussionQuery } = usePosts(feedConfig.query, feedConfig.tag);
  const [visiblePosts, setVisiblePosts] = useState(5);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const hiveUser = useHiveUser();

  const updateFeed = useCallback((query: string, tagParams: { tag: string, limit: number }[]) => {
    setFeedConfig({ query, tag: tagParams });
    setQueryCategory(query);
    setDiscussionQuery(tagParams);
  }, [setQueryCategory, setDiscussionQuery]);

  if (error) return <p>Error loading posts. Please try again later.</p>;
  if (isLoading || !posts) {
    return (
      <>
        <AuthorSearchBar onSearch={(author) => updateFeed("blog", [{ tag: author, limit: 10 }])} />
        <NavigationButtons updateFeed={updateFeed} feedConfig={feedConfig} hiveUser={hiveUser} />
        <Grid p={1} templateColumns="repeat(1, 1fr)" gap={0} minHeight="100vh" width="100%">
          {Array.from({ length: visiblePosts }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </Grid>
      </>
    );
  }

  return (
    <Box overflow="auto" sx={{ "&::-webkit-scrollbar": { display: "none" } }}>
      <AuthorSearchBar onSearch={(author) => updateFeed("blog", [{ tag: author, limit: 10 }])} />
      <NavigationButtons updateFeed={updateFeed} feedConfig={feedConfig} hiveUser={hiveUser} />
      {isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />}
      <PostFeed posts={posts} visiblePosts={visiblePosts} setVisiblePosts={setVisiblePosts} query={feedConfig.query} />
    </Box>
  );
}

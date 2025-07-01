/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useEditor } from "canva-editor/hooks";
import { PageSize, SerializedPage } from "canva-editor/types";
import CloseSidebarButton from "./CloseButton";
import TemplateSearchBox from "./components/TemplateSearchBox";
import HorizontalCarousel from "canva-editor/components/carousel/HorizontalCarousel";
import OutlineButton from "canva-editor/components/button/OutlineButton";
import { unpack } from "canva-editor/utils/minifier";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import { GET_TEMPLATE_ENDPOINT } from "canva-editor/utils/constants/api";
import TabComponent from "canva-editor/components/tabs/TabComponent";
import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";

interface Template {
  _id: string;
  title: string;
  description: string;
  templateUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string;
  userId: string;
  pages?: number;
  isPublic: boolean;
}
const TemplateContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { actions, activePage, config } = useEditor((state, config) => ({
    config,
    activePage: state.activePage,
  }));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const dataRef = useRef(false);
  const [keyword, setKeyword] = useState("");
  const isMobile = useMobileDetect();
  const [activeTab, setActiveTab] = useState("public");
  const { user } = useAuth();
  const userId = user?.userId || Cookies.get("auth_token") || "anonymous";

  const loadData = useCallback(
    async (_offset = 0, kw = "") => {
      dataRef.current = true;
      setIsLoading(true);

      // Build the API URL with query parameters based on the active tab
      let apiUrl = `${config.apis.url}${config.apis.searchTemplates}`;
      const params = new URLSearchParams();

      if (kw) {
        params.append("kw", kw);
      }

      if (activeTab === "mine") {
        // For "My Templates" tab, only fetch the current user's templates
        params.append("userId", userId);
        params.append("onlyMine", "true");
      } else {
        // For "Public" tab, only fetch public templates
        params.append("isPublic", "true");
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const res = await axios.get(apiUrl);
      console.log(res.data);
      setTemplates((templates) => [...templates, ...res.data.data]);
      setIsLoading(false);
      if (res.data.length > 0) {
        dataRef.current = false;
      }
    },
    [setIsLoading, activeTab, userId]
  );

  useEffect(() => {
    // Reset templates and offset when tab changes
    setTemplates([]);
    setOffset(0);
    loadData(0, keyword);
  }, [offset, keyword, activeTab, loadData]);

  useEffect(() => {
    const handleLoadMore = async (e: Event) => {
      const node = e.target as HTMLDivElement;
      if (
        node.scrollHeight - node.scrollTop - 80 <= node.clientHeight &&
        !dataRef.current
      ) {
        setOffset((prevOffset) => prevOffset + 1);
      }
    };

    scrollRef.current?.addEventListener("scroll", handleLoadMore);
    return () => {
      scrollRef.current?.removeEventListener("scroll", handleLoadMore);
    };
  }, [loadData]);

  const handleSearch = async (kw: string) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setOffset(0);
    setKeyword(kw);
    setTemplates([]);
  };

  const addPages = async (data: Array<SerializedPage> | SerializedPage) => {
    try {
      console.log(data);
      if (Array.isArray(data)) {
        data.forEach((page, idx) => {
          const serializedData: SerializedPage = unpack(page);
          actions.changePageSize(
            serializedData.layers.ROOT.props.boxSize as PageSize
          );
          actions.setPage(activePage + idx, serializedData);
        });
      } else {
        const serializedData: SerializedPage = unpack(data);
        console.log(serializedData);
        actions.changePageSize(
          serializedData.layers.ROOT.props.boxSize as PageSize
        );
        actions.setPage(activePage, serializedData);
      }
    } catch (err) {
      console.warn("Something went wrong!");
      console.log(err);
    }
    if (isMobile) {
      onClose();
    }
  };
  return (
    <div
      css={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        overflowY: "auto",
        display: "flex",
        padding: 16,
      }}
    >
      {!isMobile && <CloseSidebarButton onClose={onClose} />}
      <div>
        <TabComponent
          tabs={[
            { key: "public", label: "Public" },
            { key: "mine", label: "My Templates" },
          ]}
          activeTab={activeTab}
          onTabChange={(tabKey) => {
            setActiveTab(tabKey);
          }}
        />

        <TemplateSearchBox
          searchString={keyword}
          onStartSearch={handleSearch}
        />
        <div css={{ paddingTop: 8 }}>
          <HorizontalCarousel>
            {config.templateKeywordSuggestions &&
              config.templateKeywordSuggestions.split(",").map((kw) => (
                <div key={kw} className="carousel-item">
                  <OutlineButton
                    onClick={() => {
                      setKeyword(kw);
                      handleSearch(kw);
                    }}
                  >
                    {kw}
                  </OutlineButton>
                </div>
              ))}
          </HorizontalCarousel>
        </div>
      </div>
      <div
        css={{ flexDirection: "column", overflowY: "auto", display: "flex" }}
      >
        <div
          ref={scrollRef}
          css={{
            flexGrow: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gridGap: 8,
          }}
        >
          {templates.map((item, index) => (
            <div
              key={index}
              css={{ cursor: "pointer", position: "relative" }}
              onClick={async () => {
                const file = item.templateUrl.split("/");
                console.log(file[file.length - 1]);
                const templateData = await axios.get(
                  `${GET_TEMPLATE_ENDPOINT}/${file[file.length - 1]}`
                );
                console.log(templateData);
                addPages(templateData.data);
              }}
            >
              <img
                // src={`http://localhost:4000${item.thumbnailUrl}`}
                src={`${item.thumbnailUrl}`}
                loading="lazy"
                alt={item.title}
              />
              {item.description && (
                <span
                  css={{
                    position: "absolute",
                    bottom: 5,
                    right: 5,
                    backgroundColor: "rgba(17,23,29,.6)",
                    padding: "1px 6px",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: 10,
                  }}
                >
                  {item.pages ? item.pages : 1}
                </span>
              )}
            </div>
          ))}
          {isLoading && <div>Loading...</div>}
        </div>
      </div>
    </div>
  );
};

export default TemplateContent;

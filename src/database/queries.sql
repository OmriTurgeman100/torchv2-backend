select * from nodes where time < now() - interval '30 min';

select * from nodes where excluded != 'true' and time < now() - interval '30 min';

delete from nodes where title = 'cpu usage' or title = 'latency' or title = ' statuscode' or title = 'ram usage' or title = '';


with recursive node_hierarchy as (
    select node_id, parent, title, description, status, excluded, time from nodes where node_id = $1
    union all
    select nodes.node_id, nodes.parent, nodes.title, nodes.description, nodes.status, nodes.excluded, nodes.time 
    from nodes inner join node_hierarchy on nodes.parent = node_hierarchy.node_id
) 
select node_id from node_hierarchy;